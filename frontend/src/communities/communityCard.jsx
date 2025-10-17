import React, { useState } from 'react';
import CommunityPostBox from './communityPostBox';
const CommunityCard = ({ community }) => {
  const [joined, setJoined] = useState(false);

  return (
    <div className="border p-4 rounded-xl shadow-md bg-white">
      <h2 className="text-xl font-semibold">{community.title}</h2>
      <p className="text-sm mt-1">{community.description}</p>
      
      {!joined ? (
        <button
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          onClick={() => setJoined(true)}
        >
          Join
        </button>
      ) : (
        <div className="mt-4">
          <CommunityPostBox communityName={community.title} />
        </div>
      )}
    </div>
  );
};

export default CommunityCard;
