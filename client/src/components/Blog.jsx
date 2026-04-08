import { useEffect, useState } from 'react';
import axios from 'axios';
import './Blog.css'; 

function Blog() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/blogs')
      .then(res => setBlogs(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="blog-list">
      <h1>Blog Posts</h1>
      {blogs.map(blog => (
        <div key={blog._id} className="blog-post">
          <h2>{blog.title}</h2>
          {blog.image && <img src={blog.image} alt="Blog Visual" style={{ width: '300px' }} />}
          <p>{blog.content}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default Blog;

