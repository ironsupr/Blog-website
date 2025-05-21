import React from 'react';
import { Link } from 'react-router-dom';

const Story = ({ story }) => {

    const editDate = (createdAt) => {
        const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
        ];
        const d = new Date(createdAt);
        var datestring = d.getDate() + " " +monthNames[d.getMonth()] + " ," + d.getFullYear() 
        return datestring
    }

    const truncateContent = (content) => {
        const trimmedString = content.substr(0, 73);
        return trimmedString
    }
    const truncateTitle= (title) => {
        const trimmedString = title.substr(0, 69);
        return trimmedString
    }
    
    return (
        <div className="story-card">
            <div className="story-card-img">
                <Link to={`/story/${story.slug}`}>
                    <img src={`/storyImages/${story.image}`} alt={story.title} />
                </Link>
            </div>
            <div className="story-card-content">
                <Link to={`/story/${story.slug}`}>
                    <h5>{story.title.length > 76 ? truncateTitle(story.title) + "..." : story.title}</h5>
                    <p className="story-text" dangerouslySetInnerHTML={{__html: truncateContent(story.content) + "..."}}></p>
                    <p className="story-card-date">{editDate(story.createdAt)}</p>
                </Link>
            </div>
        </div>
    )
}

export default Story;
