const express = require("express")
const imageupload = require("../Helpers/Libraries/imageUpload");

const { getAccessToRoute } = require("../Middlewares/Authorization/auth");
const { 
    addStory, getAllStories, detailStory, likeStory, 
    editStory, deleteStory, editStoryPage, getAllDrafts,
    saveDraft, updateDraft, publishDraft, deleteDraft, getAllTags,
    getStoriesByTag 
} = require("../Controllers/story");
const { checkStoryExist, checkUserAndStoryExist } = require("../Middlewares/database/databaseErrorhandler");

const router = express.Router() ;

// Draft routes
router.get("/drafts", getAccessToRoute, getAllDrafts);
router.post("/draft", [getAccessToRoute, imageupload.single("image")], saveDraft);
router.put("/draft/:slug", [getAccessToRoute, checkStoryExist, checkUserAndStoryExist, imageupload.single("image")], updateDraft);
router.put("/draft/:slug/publish", [getAccessToRoute, checkStoryExist, checkUserAndStoryExist], publishDraft);
router.delete("/draft/:slug", [getAccessToRoute, checkStoryExist, checkUserAndStoryExist], deleteDraft);

// Tag routes
router.get("/tags", getAllTags);
router.get("/tag/:tag", getStoriesByTag);

// Existing routes
router.post("/addstory" ,[getAccessToRoute, imageupload.single("image")],addStory)

router.post("/:slug", checkStoryExist, detailStory)

router.post("/:slug/like",[getAccessToRoute,checkStoryExist] ,likeStory)

router.get("/editStory/:slug",[getAccessToRoute,checkStoryExist,checkUserAndStoryExist] , editStoryPage)

router.put("/:slug/edit",[getAccessToRoute,checkStoryExist,checkUserAndStoryExist, imageupload.single("image")] ,editStory)

router.delete("/:slug/delete",[getAccessToRoute,checkStoryExist,checkUserAndStoryExist] ,deleteStory)

router.get("/getAllStories",getAllStories)

router.get("/getDrafts", getAccessToRoute, getAllDrafts)

module.exports = router