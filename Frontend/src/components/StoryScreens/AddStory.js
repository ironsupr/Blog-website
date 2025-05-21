import React, { useRef, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { AuthContext } from "../../Context/AuthContext"
import { AiOutlineUpload } from 'react-icons/ai'
import { FiArrowLeft } from 'react-icons/fi'
import '../../Css/AddStory.css'

const AddStory = () => {
    const { config } = useContext(AuthContext)
    const imageEl = useRef(null)
    const editorEl = useRef(null)
    const [image, setImage] = useState('')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState([])
    const [tagInput, setTagInput] = useState('')
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [isDraftSaved, setIsDraftSaved] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [typingTimeout, setTypingTimeout] = useState(null)
    const [lastSaved, setLastSaved] = useState(null)
    const [currentDraftSlug, setCurrentDraftSlug] = useState(null)

    const clearInputs = () => {
        setTitle('')
        setContent('')
        setImage('')
        setTags([])
        setTagInput('')
        editorEl.current.editor.setData('')
        imageEl.current.value = ""
    }

    // Auto-save after 5 seconds of inactivity
    useEffect(() => {
        if (isTyping) {
            clearTimeout(typingTimeout)
            const timeout = setTimeout(() => {
                saveDraft()
                setIsTyping(false)
            }, 5000)
            setTypingTimeout(timeout)
        }
        return () => clearTimeout(typingTimeout)
    }, [isTyping, title, content, tags])

    // Auto-save every 30 seconds if there's content
    useEffect(() => {
        if (title || content) {
            const autoSaveInterval = setInterval(() => {
                saveDraft()
            }, 30000)
            return () => clearInterval(autoSaveInterval)
        }
    }, [title, content, tags])

    const handleTyping = () => {
        setIsTyping(true)
    }

    const saveDraft = async () => {
        if (!title && !content) return

        const formdata = new FormData()
        formdata.append("title", title)
        formdata.append("image", image)
        formdata.append("content", content)
        formdata.append("isDraft", true)
        formdata.append("tags", JSON.stringify(tags))

        try {
            if (currentDraftSlug) {
                // Update existing draft
                await axios.put(`/story/draft/${currentDraftSlug}`, formdata, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    }
                })
            } else {
                // Create new draft
                const { data } = await axios.post("/story/draft", formdata, config)
                setCurrentDraftSlug(data.data.slug)
            }
            setLastSaved(new Date())
            setIsDraftSaved(true)
            setTimeout(() => setIsDraftSaved(false), 3000)
        } catch (error) {
            console.error("Error saving draft:", error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const formdata = new FormData()
        formdata.append("title", title)
        formdata.append("image", image)
        formdata.append("content", content)
        formdata.append("isDraft", false)
        formdata.append("tags", JSON.stringify(tags))

        if (image === '') {
            setError("Please select an image")
            setTimeout(() => {
                setError('')
            }, 7000)
            return
        }

        try {
            const { data } = await axios.post("/story/addstory", formdata, config)
            setSuccess('Story published successfully')
            clearInputs()
            setTimeout(() => {
                setSuccess('')
            }, 7000)
        } catch (error) {
            setTimeout(() => {
                setError('')
            }, 7000)
            setError(error.response.data.error)
        }
    }

    const handleTagAdd = (e) => {
        e.preventDefault()
        if (tagInput && !tags.includes(tagInput)) {
            setTags([...tags, tagInput])
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    return (
        <div className="Inclusive-addStory-page">
            <Link to={'/'} >
                <FiArrowLeft />
            </Link>
            <form onSubmit={handleSubmit} className="addStory-form">
                {error && <div className="error_msg">{error}</div>}
                {success && <div className="success_msg">
                    <span>{success}</span>
                    <Link to="/">Go home</Link>
                </div>}
                {isDraftSaved && 
                    <div className="success_msg">
                        Draft saved {lastSaved && `at ${lastSaved.toLocaleTimeString()}`}
                    </div>
                }

                <div className="draft-controls">
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
                    <button 
                        type="button" 
                        className="save-draft-btn"
                        onClick={saveDraft}
                        disabled={!title && !content}
                    >
                        Save Draft
                    </button>
                </div>

                <div className="tags-section">
                    <div className="tags-input">
                        <input
                            type="text"
                            placeholder="Add a tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleTagAdd(e)}
                        />
                        <button type="button" onClick={handleTagAdd}>Add</button>
                    </div>
                    <div className="tags-list">
                        {tags.map((tag, index) => (
                            <span key={index} className="tag">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)}>&times;</button>
                            </span>
                        ))}
                    </div>
                </div>

                <CKEditor
                    editor={ClassicEditor}
                    onChange={(e, editor) => {
                        const data = editor.getData()
                        setContent(data)
                        handleTyping()
                    }}
                    ref={editorEl}
                />

                <div className="StoryImageField">
                    <AiOutlineUpload />
                    <div className="txt">
                        {image ? image.name :
                            "Include a high-quality image in your story to make it more inviting to readers."
                        }
                    </div>
                    <input
                        name="image"
                        type="file"
                        ref={imageEl}
                        onChange={(e) => setImage(e.target.files[0])}
                    />
                </div>

                <button 
                    type='submit' 
                    disabled={image ? false : true} 
                    className={image ? 'addStory-btn' : 'dis-btn'}
                >
                    Publish
                </button>
            </form>
        </div>
    )
}

export default AddStory


