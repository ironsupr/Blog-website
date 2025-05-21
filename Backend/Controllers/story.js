const asyncErrorWrapper = require("express-async-handler")
const Story = require("../Models/story");
const deleteImageFile = require("../Helpers/Libraries/deleteImageFile");
const {searchHelper, paginateHelper} =require("../Helpers/query/queryHelpers")

const addStory = asyncErrorWrapper(async (req,res,next)=> {
    const {title, content, isDraft, tags} = req.body 

    var wordCount = content.trim().split(/\s+/).length
    let readtime = Math.floor(wordCount/200)

    try {
        const newStory = await Story.create({
            title,
            content,
            author: req.user._id,
            image: req.savedStoryImage,
            readtime,
            isDraft: isDraft === 'true',
            tags: tags ? JSON.parse(tags) : [],
            lastSaved: new Date()
        })

        return res.status(200).json({
            success: true,
            message: isDraft === 'true' ? "Draft saved successfully" : "Story published successfully",
            data: newStory
        })
    }
    catch(error) {
        deleteImageFile(req)
        return next(error)
    }
})

const getAllStories = asyncErrorWrapper(async (req,res,next) =>{
    let query = Story.find({ isDraft: false }); // Only get published stories

    query = searchHelper("title",query,req)

    const paginationResult = await paginateHelper(Story, query, req)

    query = paginationResult.query

    query = query.sort("-likeCount -commentCount -createdAt")

    const stories = await query
    
    return res.status(200).json({
        success: true,
        count: stories.length,
        data: stories,
        page: paginationResult.page,
        pages: paginationResult.pages
    })
})

const getAllDrafts = asyncErrorWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const drafts = await Story.find({ 
        author: userId, 
        isDraft: true 
    })
    .sort('-lastSaved')
    .populate('author')
    .select('title content image tags lastSaved slug');

    return res.status(200).json({
        success: true,
        data: drafts
    });
});

const saveDraft = asyncErrorWrapper(async (req, res, next) => {
    const { title, content, tags } = req.body;
    
    // Check if draft with same title exists
    const existingDraft = await Story.findOne({
        title,
        author: req.user.id,
        isDraft: true
    });

    if (existingDraft) {
        // Update existing draft
        existingDraft.content = content;
        existingDraft.tags = JSON.parse(tags);
        existingDraft.lastSaved = new Date();
        
        if (req.file) {
            if (existingDraft.image !== "default.jpg") {
                deleteImageFile(req, existingDraft.image);
            }
            existingDraft.image = req.savedStoryImage;
        }
        
        await existingDraft.save();
        
        return res.status(200).json({
            success: true,
            message: "Draft updated successfully",
            data: existingDraft
        });
    }
    
    // Create new draft if none exists
    const draft = await Story.create({
        title,
        content,
        author: req.user.id,
        image: req.savedStoryImage || "default.jpg",
        tags: JSON.parse(tags),
        isDraft: true,
        lastSaved: new Date()
    });

    return res.status(201).json({
        success: true,
        message: "Draft created successfully",
        data: draft
    });
});

const updateDraft = asyncErrorWrapper(async (req, res, next) => {
    const { slug } = req.params;
    const { title, content, tags } = req.body;
    
    let draft = await Story.findOne({ 
        slug,
        isDraft: true,
        author: req.user.id
    });
    
    if (!draft) {
        return res.status(404).json({
            success: false,
            error: "Draft not found"
        });
    }
    
    draft.title = title;
    draft.content = content;
    draft.tags = JSON.parse(tags);
    draft.lastSaved = new Date();
    
    if (req.file) {
        if (draft.image !== "default.jpg") {
            deleteImageFile(req, draft.image);
        }
        draft.image = req.savedStoryImage;
    }
    
    await draft.save();

    return res.status(200).json({
        success: true,
        message: "Draft updated successfully",
        data: draft
    });
});

const deleteDraft = asyncErrorWrapper(async (req, res, next) => {
    const { slug } = req.params;
    
    const draft = await Story.findOne({ 
        slug,
        isDraft: true,
        author: req.user.id
    });
    
    if (!draft) {
        return res.status(404).json({
            success: false,
            error: "Draft not found"
        });
    }
    
    if (draft.image !== "default.jpg") {
        deleteImageFile(req, draft.image);
    }
    
    await draft.remove();
    
    return res.status(200).json({
        success: true,
        message: "Draft deleted successfully"
    });
});

const publishDraft = asyncErrorWrapper(async (req, res, next) => {
    const { slug } = req.params;
    
    try {
        // First, find the draft to be published
        const draft = await Story.findOne({ 
            slug: slug, 
            isDraft: true,
            author: req.user.id // Ensure user owns the draft
        });
        
        if (!draft) {
            return res.status(404).json({
                success: false,
                error: "Draft not found"
            });
        }

        // Get all drafts by this author with the same title
        const relatedDrafts = await Story.find({
            author: req.user.id,
            title: draft.title,
            isDraft: true,
            _id: { $ne: draft._id }
        });

        // Delete all related drafts except the one being published
        if (relatedDrafts.length > 0) {
            await Story.deleteMany({
                _id: { $in: relatedDrafts.map(d => d._id) }
            });
        }

        // Calculate read time
        const wordCount = draft.content.trim().split(/\s+/).length;
        const readtime = Math.floor(wordCount/200);

        // Update the story to mark it as published
        const publishedStory = await Story.findOneAndUpdate(
            { _id: draft._id },
            { 
                isDraft: false,
                readtime,
                lastSaved: new Date()
            },
            { new: true }
        ).populate('author');

        // Delete all other drafts of this story by this author
        await Story.deleteMany({
            _id: { $ne: draft._id },
            author: req.user.id,
            title: draft.title,
            isDraft: true
        });

        return res.status(200).json({
            success: true,
            message: "Story published successfully",
            data: publishedStory
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Error publishing story"
        });
    }
});

const detailStory =asyncErrorWrapper(async(req,res,next)=>{

    const {slug}=req.params ;
    const {activeUser} =req.body 

    const story = await Story.findOne({
        slug: slug 
    }).populate("author likes")

    const storyLikeUserIds = story.likes.map(json => json.id)
    const likeStatus = storyLikeUserIds.includes(activeUser._id)


    return res.status(200).
        json({
            success:true,
            data : story,
            likeStatus:likeStatus
        })

})

const likeStory =asyncErrorWrapper(async(req,res,next)=>{

    const {activeUser} =req.body 
    const {slug} = req.params ;

    const story = await Story.findOne({
        slug: slug 
    }).populate("author likes")
   
    const storyLikeUserIds = story.likes.map(json => json._id.toString())
   
    if (! storyLikeUserIds.includes(activeUser._id)){

        story.likes.push(activeUser)
        story.likeCount = story.likes.length
        await story.save() ; 
    }
    else {

        const index = storyLikeUserIds.indexOf(activeUser._id)
        story.likes.splice(index,1)
        story.likeCount = story.likes.length

        await story.save() ; 
    }
 
    return res.status(200).
    json({
        success:true,
        data : story
    })

})

const editStoryPage  =asyncErrorWrapper(async(req,res,next)=>{
    const {slug } = req.params ; 
   
    const story = await Story.findOne({
        slug: slug 
    }).populate("author likes")

    return res.status(200).
        json({
            success:true,
            data : story
    })

})


const editStory  =asyncErrorWrapper(async(req,res,next)=>{
    const {slug } = req.params ; 
    const {title ,content ,image ,previousImage } = req.body;

    const story = await Story.findOne({slug : slug })

    story.title = title ;
    story.content = content ;
    story.image =   req.savedStoryImage ;

    if( !req.savedStoryImage) {
        // if the image is not sent
        story.image = image
    }
    else {
        // if the image sent
        // old image locatıon delete
       deleteImageFile(req,previousImage)

    }

    await story.save()  ;

    return res.status(200).
        json({
            success:true,
            data :story
    })

})

const deleteStory  =asyncErrorWrapper(async(req,res,next)=>{

    const {slug} = req.params  ;

    const story = await Story.findOne({slug : slug })

    deleteImageFile(req,story.image) ; 

    await story.remove()

    return res.status(200).
        json({
            success:true,
            message : "Story delete succesfully "
    })

})

const getAllTags = asyncErrorWrapper(async (req, res, next) => {
    const tags = await Story.distinct('tags', { isDraft: false });
    
    return res.status(200).json({
        success: true,
        data: tags
    });
});

const getStoriesByTag = asyncErrorWrapper(async (req, res, next) => {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const stories = await Story.find({ 
        tags: tag,
        isDraft: false 
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('author');

    const totalStories = await Story.countDocuments({ tags: tag, isDraft: false });
    const pages = Math.ceil(totalStories / limit);

    return res.status(200).json({
        success: true,
        data: stories,
        pages,
        page,
        totalStories
    });
});

module.exports = {
    addStory,
    getAllStories,
    getAllDrafts,
    saveDraft,
    updateDraft,
    deleteDraft,
    publishDraft,
    detailStory,
    likeStory,
    editStoryPage,
    editStory,
    deleteStory,
    getAllTags,
    getStoriesByTag
}