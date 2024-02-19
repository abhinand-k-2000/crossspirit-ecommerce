const multer = require("multer");
const path = require("path");
const Banner = require("../models/bannerModel");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/banner");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

module.exports.upload = multer({ storage: storage})


module.exports.addBanner = async (req, res, next) => {
    try {
        const bannerImage = req.file;
        const {title, description} = req.body

        const banner = new Banner({
            title: title,
            description: description,
            imagePath: bannerImage.filename
        })    

        await banner.save()

        res.redirect('/admin/banner/banner-list')
    } catch (error) {
        console.log(error)
        next(error)
    }
}

module.exports.loadBannerList = async (req, res, next) => {
    try {
        const bannerData = await Banner.find()

        res.render('banner-list', {banner: bannerData})
    } catch (error) {
        console.log(error)
        next(error)
    }
}


module.exports.loadAddBanner = (req, res, next) => {
    try {
        res.render('add-banner')
    } catch (error) {
        console.log(error)
        next(error)
    }
}

module.exports.loadEditBanner = async (req, res, next) => {
    try {
        const {bannerId} = req.params
        const banner = await Banner.findById(bannerId)
        console.log(banner)
        res.render('edit-banner', {banner})
    } catch (error) {
        console.log(error)
    }
}

module.exports.editBanner = async (req, res, next) => {
    try {
        const {bannerId} = req.params
        const {title, description} = req.body
        const image = req.file

        let existingBanner = await Banner.findById(bannerId);
        if(!existingBanner) {
            return res.status(404).send("Banner not found");
        }

        existingBanner.title = title || existingBanner.title;
        existingBanner.description = description || existingBanner.description;
        existingBanner.imagePath = image? image.filename : existingBanner.imagePath

        await existingBanner.save()

        res.redirect('/admin/banner/banner-list')
    } catch (error) {
        console.log(error)
        next(error)
    }
}

module.exports.deleteBanner = async (req, res, next) => {
    try {
        const {bannerId} = req.query;
        const banner = await Banner.deleteOne({_id: bannerId});

        if(banner.deletedCount === 1) {
            res.status(200).json({message: "Banner deleted Successfully"})
        } else{
            res.status(400).json({message: "Error in deletign the banner"})
        }

    } catch (error) {
        console.log(error);
        next(error);
    }
}