import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { IoMdSend } from 'react-icons/io';
import Loader from '../GeneralScreens/Loader';
import '../../Css/DraftsPage.css';

const DraftsPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [publishingSlug, setPublishingSlug] = useState(null);

    useEffect(() => {
        const fetchDrafts = async () => {
            try {
                const { data } = await axios.get("/story/getDrafts", {
                    headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    },
                });
                setDrafts(data.data);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        };
        fetchDrafts();
    }, []);

    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(date).toLocaleDateString('en-US', options);
    };

    const handleDelete = async (slug) => {
        if (window.confirm("Are you sure you want to delete this draft?")) {
            try {
                await axios.delete(`/story/${slug}/delete`, {
                    headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    },
                });
                setDrafts(drafts.filter(draft => draft.slug !== slug));
            } catch (error) {
                console.log(error);
            }
        }
    };

    const handlePublish = async (slug) => {
        if (window.confirm("Are you sure you want to publish this story?")) {
            setPublishingSlug(slug);
            try {
                const { data } = await axios.put(`/story/draft/${slug}/publish`, {}, {
                    headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    },
                });
                
                // Remove the draft from the list
                setDrafts(drafts.filter(draft => draft.slug !== slug));
                
                // Navigate to the published story
                if (data.success && data.data) {
                    window.location.href = `/story/${data.data.slug}`;
                }
            } catch (error) {
                console.log(error);
                alert(error.response?.data?.error || "Error publishing story");
            } finally {
                setPublishingSlug(null);
            }
        }
    };

    return (
        <div className="drafts-page">
            {loading ? (
                <Loader />
            ) : (
                <>
                    <div className="drafts-header">
                        <h1>My Drafts</h1>
                        <Link to="/addstory" className="new-draft-btn">
                            <FiPlus />
                            Create New Story
                        </Link>
                    </div>
                    {drafts.length === 0 ? (
                        <div className="no-drafts">
                            <p>You don't have any drafts yet.</p>
                            <p>Start writing a new story to create one!</p>
                        </div>
                    ) : (
                        <div className="drafts-list">
                            {drafts.map((draft) => (
                                <div key={draft._id} className="draft-card">
                                    <div className="draft-content">
                                        <h2>{draft.title || "Untitled Draft"}</h2>
                                        <div className="draft-preview" 
                                            dangerouslySetInnerHTML={{
                                                __html: draft.content.substring(0, 150) + "..."
                                            }}>
                                        </div>
                                        <div className="draft-meta">
                                            <span>Last saved: {formatDate(draft.lastSaved)}</span>
                                            {draft.tags && draft.tags.length > 0 && (
                                                <div className="draft-tags">
                                                    {draft.tags.map((tag, index) => (
                                                        <span key={index} className="tag">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="draft-actions">
                                        <button 
                                            onClick={() => handlePublish(draft.slug)}
                                            className="publish-draft-btn"
                                            disabled={publishingSlug === draft.slug}
                                            title="Publish story">
                                            {publishingSlug === draft.slug ? 'Publishing...' : (
                                                <>
                                                    <IoMdSend />
                                                    <span>Publish</span>
                                                </>
                                            )}
                                        </button>
                                        <Link to={`/story/${draft.slug}/edit`} 
                                            className="edit-draft-btn"
                                            title="Edit draft">
                                            <FiEdit />
                                            <span>Edit</span>
                                        </Link>
                                        <button 
                                            onClick={() => handleDelete(draft.slug)}
                                            className="delete-draft-btn"
                                            title="Delete draft">
                                            <RiDeleteBin6Line />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DraftsPage;
