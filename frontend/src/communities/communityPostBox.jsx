import React, { useState } from 'react';

const CommunityPostBox = ({ communityName }) => {
  const [postText, setPostText] = useState('');
  const [posts, setPosts] = useState([]);

  const handlePost = () => {
    if (postText.trim() !== '') {
      setPosts([...posts, { content: postText, timestamp: new Date() }]);
      setPostText('');
    }
  };

  return (
    <div className="mt-2">
      <h3 className="font-semibold text-green-700 mb-1">Post in {communityName}</h3>
      <textarea
        className="w-full border p-2 rounded-lg"
        rows="3"
        placeholder="Share your thoughts..."
        value={postText}
        onChange={(e) => setPostText(e.target.value)}
      />
      <button
        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={handlePost}
      >
        Post
      </button>

      <div className="mt-4 space-y-2">
        {posts.map((post, idx) => (
          <div key={idx} className="bg-gray-100 p-3 rounded-lg">
            <p>{post.content}</p>
            <span className="text-xs text-gray-500">{post.timestamp.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPostBox;
