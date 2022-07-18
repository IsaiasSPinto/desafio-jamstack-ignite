import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
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

export default function Post({ post }: PostProps) {
  const words = post.data.content.reduce((total, item) => {
    total += item.heading.split(" ").length
    const body = item.body.map(body => body.text.split(" ").length)
    body.map(word => (total += word))
    return total
  }, 0)

  const timeReading = Math.ceil(words / 200)

  const router = useRouter()

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }


  return (
    <div>
      <h1>{post.data.title}</h1>
      <time>{format(new Date(post.first_publication_date),"dd MMM yyyy",{ locale: ptBR })}</time>
      <span>{post.data.author}</span>
      <span>{`${timeReading} min`}</span>
      {post.data.content.map((content , index) => {
        return (
          <div key={index}>
            <h1>{content.heading}</h1>
            <div
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
              />
          </div>
        )
      })}
    </div>
  )
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  let slugs = posts.results.map(post => {
    return {
      params : {
        slug : post.uid
      }
    }
  })

  return {
    paths: slugs,
    fallback: true
  }
}

export const getStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug));

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle : response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body]
        }
      })
    }
  }


  return {
    props: {
      post: post

    }
  }
};
