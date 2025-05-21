import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import Loader from '../GeneralScreens/Loader';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from "../../Context/AuthContext";
import { AiOutlineUpload } from 'react-icons/ai'
import { IoMdSend } from 'react-icons/io'
import '../../Css/EditStory.css'

const EditStory = () => {
    const { config } = useContext(AuthContext)
    const slug = useParams().slug
    const imageEl = useRef(null)
    const [loading, setLoading] = useState(true)
    const [story, setStory] = useState({})
    const [image, setImage] = useState('')
    const [previousImage, setPreviousImage] = useState('')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [isPublishing, setIsPublishing] = useState(false)
    const [isDraftSaved, setIsDraftSaved] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [isTyping, setIsTyping] = useState(false)
    const [typingTimeout, setTypingTimeout] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        const getStoryInfo = async () => {
            setLoading(true)
            try {
                const { data } = await axios.get(`/story/editStory/${slug}`, {
                    headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    }
                })
                const storyData = data.data
                setStory(storyData)
                setTitle(storyData.title || '')
                setContent(storyData.content || '')
                setImage(storyData.image || '')
                setPreviousImage(storyData.image || '')
                setLoading(false)
            }
            catch (error) {
                setError(error.response?.data?.error || 'Failed to load story')
                setTimeout(() => {
                    navigate("/")
                }, 2000)
            }
        }
        getStoryInfo()
    }, [slug, navigate])

    // Auto-save after 5 seconds of inactivity
    useEffect(() => {
        if (isTyping && story.isDraft) {
            clearTimeout(typingTimeout)
            const timeout = setTimeout(() => {
                saveDraft()
                setIsTyping(false)
            }, 5000)
            setTypingTimeout(timeout)
        }
        return () => clearTimeout(typingTimeout)
    }, [isTyping, title, content])

    // Auto-save every 30 seconds for drafts
    useEffect(() => {
        if (story.isDraft && (title || content)) {
            const autoSaveInterval = setInterval(() => {
                saveDraft()
            }, 30000)
            return () => clearInterval(autoSaveInterval)
        }
    }, [title, content, story.isDraft])

    const handleTyping = () => {
        setIsTyping(true)
    }

    const saveDraft = async () => {
        if (!title && !content) return
        
        try {
            const formdata = new FormData()
            formdata.append("title", title)
            formdata.append("content", content)
            formdata.append("image", image)
            formdata.append("previousImage", previousImage)
            formdata.append("tags", JSON.stringify(story.tags || []))
            formdata.append("isDraft", "true")

            const response = await axios.put(
                `/story/draft/${slug}`, 
                formdata,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    }
                }
            )

            if (response.data.success) {
                setLastSaved(new Date())
                setIsDraftSaved(true)
                setTimeout(() => setIsDraftSaved(false), 3000)
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to save draft')
            setTimeout(() => {
                setError('')
            }, 4500)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formdata = new FormData()
            formdata.append("title", title)
            formdata.append("content", content)
            formdata.append("image", image)
            formdata.append("previousImage", previousImage)
            formdata.append("tags", JSON.stringify(story.tags || []))
            formdata.append("isDraft", "false")

            const response = await axios.put(
                `/story/${slug}/edit`, 
                formdata,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    }
                }
            )

            if (response.data.success) {
                setSuccess('Story saved successfully')
                setTimeout(() => {
                    navigate(`/story/${slug}`)
                }, 2000)
            }
        } catch (error) {
            setError(error.response?.data?.error || 'An error occurred while editing the story')
            setTimeout(() => {
                setError('')
            }, 4500)
        }
    }

    const handlePublish = async () => {
        if (window.confirm("Are you sure you want to publish this story?")) {
            setIsPublishing(true);
            try {
                const { data } = await axios.put(`/story/draft/${slug}/publish`, {}, {
                    headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    },
                });
                if (data.success) {
                    setSuccess('Story published successfully');
                    // Redirect immediately to the published story
                    navigate(`/story/${slug}`);
                }
                setTimeout(() => {
                    setError('')
                }, 4500)
            } finally {
                setIsPublishing(false)
            }
        }
    }

    return (
        <>
            {loading ? <Loader /> : (
                <div className="Inclusive-editStory-page">
                    <form onSubmit={handleSubmit} className="editStory-form">
                        {error && <div className="error_msg">{error}</div>}
                        {success && 
                            <div className="success_msg">
                                <span>{success}</span>
                                <Link to="/">Go home</Link>
                            </div>
                        }
                        {isDraftSaved && 
                            <div className="success_msg">
                                Draft saved {lastSaved && `at ${lastSaved.toLocaleTimeString()}`}
                            </div>
                        }

                        <input
                            type="text"
                            required
                            id="title"
                            placeholder="Title"
                            onChange={(e) => {
                                setTitle(e.target.value)
                                handleTyping()
                            }}
                            value={title}
                        />

                        <CKEditor
                            editor={ClassicEditor}
                            onChange={(e, editor) => {
                                const data = editor.getData()
                                setContent(data)
                                handleTyping()
                            }}
                            data={content}
                        />

                        <div className="currentlyImage">
                            <div className="absolute">
                                Currently Image
                            </div>
                            <img src={`http://localhost:5000/storyImages/${previousImage}`} alt="storyImage" />
                        </div>
                        <div className="StoryImageField">
                            <AiOutlineUpload />
                            <div className="txt">
                                {image === previousImage ? "Change the image in your story" :
                                    image.name}
                            </div>
                            <input
                                name="image"
                                type="file"
                                ref={imageEl}
                                onChange={(e) => {
                                    setImage(e.target.files[0])
                                }}
                            />
                        </div>

                        <div className="button-group">
                            {story.isDraft ? (
                                <>
                                    <button
                                        type="button"
                                        className="save-draft-btn"
                                        onClick={saveDraft}
                                        disabled={!title && !content}
                                    >
                                        Save Draft
                                    </button>
                                    <button 
                                        type="button"
                                        className="publish-btn"
                                        onClick={handlePublish}
                                        disabled={isPublishing}
                                    >
                                        <IoMdSend />
                                        <span>
                                            {isPublishing ? 'Publishing...' : 'Publish'}
                                        </span>
                                    </button>
                                </>
                            ) : (
                                <button 
                                    type="submit" 
                                    className="editStory-btn"
                                >
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}

export default EditStory
