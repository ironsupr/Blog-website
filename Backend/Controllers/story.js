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


const getStoriesByTag = asyncErrorWrapper(async (req, res, next) => {
    const { tag } = req.params;
    const stories = await Story.find({
        tags: tag.toLowerCase(),
        isDraft: false
    })
    .populate('author')
    .sort('-createdAt');

    return res.status(200).json({
        success: true,
        data: stories
    });
});

const getAllTags = asyncErrorWrapper(async (req, res, next) => {
    const tags = await Story.aggregate([
        { $match: { isDraft: false } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    return res.status(200).json({
        success: true,
        data: tags
    });
});

const updateDraft = asyncErrorWrapper(async (req, res, next) => {
    const { slug } = req.params;
    const { title, content, tags } = req.body;

    const story = await Story.findOne({ slug: slug, author: req.user._id });
    
    if (!story) {
        return res.status(404).json({
            success: false,
            message: 'Draft not found'
        });
    }

    story.title = title;
    story.content = content;
    story.tags = tags ? JSON.parse(tags) : story.tags;
    story.draftLastModified = new Date();

    await story.save();

    return res.status(200).json({
        success: true,
        message: 'Draft updated successfully',
        data: story
    });
});

module.exports ={
    addStory,
    getAllStories,
    getAllDrafts,
    detailStory,
    getStoriesByTag,
    getAllTags,
    updateDraft,
    likeStory,
    editStoryPage,
    editStory ,
    deleteStory
}