import React, { useState } from 'react';
import './communities.css';

export default function Communities() {
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
const [communityPosts, setCommunityPosts] = useState([]);
const fetchPosts = async (communityId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/community-posts/${communityId}`);
    const data = await response.json();
    setCommunityPosts(data.reverse()); // Show newest first
  } catch (err) {
    console.error('Error fetching posts:', err);
  }
};

const handleJoin = (id) => {
  setActiveCommunity(id);
  fetchPosts(id);
};
  const handleBack = () => {
    setActiveCommunity(null);
  };

  
  const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      img.onload = () => {
        // Create canvas to draw compressed image
        const canvas = document.createElement("canvas");

        const MAX_WIDTH = 1024;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to Blob with JPEG compression
        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            setSelectedImage(resizedFile);
            setImagePreview(URL.createObjectURL(blob));
          },
          "image/jpeg",
          0.9 // JPEG quality (0–1)
        );
      };

      img.src = readerEvent.target.result;
    };

    reader.readAsDataURL(file);
  }
};


  const handlePost = async () => {
  if (!caption && !selectedImage) {
    alert("Please write a caption or select an image.");
    return;
  }

  const formData = new FormData();
  formData.append('caption', caption);
  formData.append('community', activeCommunity);
  if (selectedImage) {
    formData.append('image', selectedImage);
  }

  try {
    const response = await fetch('http://localhost:5000/api/community-post', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!response.ok) {
  throw new Error(result.message || 'Unknown error occurred');
}
    alert(result.message);

    // Reset
    setCaption('');
    setSelectedImage(null);
    setImagePreview(null);
     await fetchPosts(activeCommunity);

  } catch (error) {
    console.error('Error posting:', error);
    alert('Failed to post');
  }
};


  if (activeCommunity) {
    const selected = communityData.find((c) => c.id === activeCommunity);
    return (
      <div className="discussion-tab">
        <h2>{selected.icon} {selected.title} - Discussion</h2>
        <button className="back-btn" onClick={handleBack}>← Back to Communities</button>

        <div className="discussion-box">
  {communityPosts.length === 0 ? (
    <p>No posts yet. Be the first to share!</p>
  ) : (
    communityPosts.map(post => (
      <div key={post.id} className="post-item">
        {post.image && <img src={`http://localhost:5000${post.image}`} alt="Post" className="post-image" />}
        {post.caption && <p className="post-caption">{post.caption}</p>}
      </div>
    ))
  )}
</div>


        <textarea
          className="comment-box"
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        ></textarea>

        <input type="file" accept="image/*" onChange={handleImageChange} />

        {imagePreview && (
          <div className="preview-container">
            <img src={imagePreview} alt="Preview" className="preview-image" />
          </div>
        )}

        <button className="post-btn" onClick={handlePost}>Post</button>
      </div>
    );
  }

  return (
    <div className="community-grid">
      {communityData.map((community) => (
        <div key={community.id} className="community-card">
          <h3>{community.icon} {community.title}</h3>
          <p>{community.description}</p>
          <button onClick={() => handleJoin(community.id)}>Join</button>
        </div>
      ))}
    </div>
  );
}

const communityData = [
  {
    id: 'drives',
    title: 'Environmental Drives',
    icon: '🌿',
    description: 'Join and participate in tree plantation drives, clean-up missions, and more.',
  },
  {
    id: 'awareness',
    title: 'Environmental Awareness',
    icon: '📢',
    description: 'Spread knowledge and educate others about environmental issues.',
  },
  {
    id: 'pollution',
    title: 'Pollution Control',
    icon: '🛑',
    description: 'Collaborate on reducing air, water, and land pollution in your area.',
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Environment',
    icon: '🌍',
    description: 'Explore sustainable lifestyle changes and eco-friendly habits.',
  },
];
