const banner_route = require('express').Router()

const {loadAddBanner, loadBannerList, upload, addBanner, loadEditBanner, editBanner, deleteBanner} = require('../controllers/bannerController')

banner_route.get('/banner/banner-list', loadBannerList)
banner_route.get('/banner/add-banner', loadAddBanner)

banner_route.post('/banner/add-banner', upload.single('image'), addBanner)

banner_route.get('/banner/edit-banner/:bannerId', loadEditBanner)
banner_route.post('/banner/edit-banner/:bannerId', upload.single('image'), editBanner)
banner_route.delete('/banner/delete-banner', deleteBanner)

module.exports = banner_route