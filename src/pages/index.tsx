import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<PostPagination>({
    ...postsPagination,
    results: postsPagination.results.map(post => ({
      ...post,
      first_publication_date: post.first_publication_date
    })),
  })

  async function loadPosts() {

    const res = await fetch(`${posts.next_page}`)
      .then(data => data.json())

    setPosts({
      ...posts,
      results: [...posts.results, ...res.results],
      next_page: res.next_page
    })
  }



  return (
    <div>
      {posts.results.map(post => (
        <Link key={post.uid} href={`/post/${post.uid}`}>
          <a >
            <strong>{post.data.title}</strong>
            <p>{post.data.subtitle}</p>
            <time>{format(new Date(post.first_publication_date),"dd MMM yyyy",{ locale: ptBR })}</time>
            <span>{post.data.author}</span>
          </a>
        </Link>
        ))}
        {posts.next_page && (
          <button type='button' onClick={loadPosts}>Carregar mais posts</button>
        )}
    </div>

  )

}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', { pageSize: 1 });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts
      }

    }
  }
};
