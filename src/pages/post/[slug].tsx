import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <span>Carregando...</span>;
  }

  const readMinutes = post.data.content.reduce((acc, content) => {
    function countWords(str: string): number {
      return str.trim().split(/\s+/).length;
    }

    // eslint-disable-next-line no-param-reassign
    acc += countWords(content.heading) / 200;
    // eslint-disable-next-line no-param-reassign
    acc += countWords(RichText.asText(content.body)) / 200;

    return Math.ceil(acc);
  }, 0);

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <Header />
      <main className={styles.container}>
        <div className={styles.content}>
          <img src={post.data.banner.url} alt="post-banner" />
          <strong className={styles.postTitle}>{post.data.title}</strong>
          <div className={styles.postInfo}>
            <FiCalendar size={20} color="#bbb" />
            <time>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <FiUser size={20} color="#bbb" />
            <span>{post.data.author}</span>
            <FiClock size={20} color="#bbb" />
            <span>{readMinutes} min</span>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map(content => (
              <div key={content.heading}>
                <strong className={styles.sectionTitle}>
                  {content.heading}
                </strong>
                <div
                  className={styles.sectionBody}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.banner', 'post.author', 'post.content'],
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
      subtitle: response.data.subtitle,
    },
    uid: response.uid,
  };

  return {
    props: {
      post,
    },
  };
};
