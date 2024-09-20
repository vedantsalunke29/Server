import User from "../models/userModel.js";
import Validate from "../models/validateModel.js";
import userImage from "../models/userImageModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import bcrypt from "bcryptjs"
import generateToken from "../utils/generateToken.js"
import Image from "../models/imageModel.js";
import nodemailer from "nodemailer"
import { uploadCloudinary, deleteCloudinary } from "../utils/cloudinary.js";
import Events from "../models/eventModel.js";
import Discuss from "../models/discussModel.js";
import Note from "../models/notesModel.js";
import Announcement from "../models/announcementModel.js";

// Login SignUp Logout

const createUser = asyncHandler(async (req, res) => {
    const form = req.body;
    const regIdNo = form.regIdNo;
    const name = form.name
    const email = form.email
    const password = form.password
    const otp = form.otp;
    if (!regIdNo || !name || !password || !email) res.send("provide");

    try {
        const userValid = await Validate.findOne({ regIdNo, email });
        const userExist = await User.findOne({ regIdNo });
        if (userExist) res.json("exits");
        else if (userValid) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newUser = new User({ regIdNo: regIdNo, name: name, email: email, password: hashedPassword })
            generateToken(res, newUser._id);
            await newUser.save();
            const transporter = nodemailer.createTransport({
                service: "Gmail",
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.APP_PASS,
                },
            })

            const mailOption = {
                from: "One Pict",
                to: userValid.email,
                subject: "Verification Code for Sign Up",
                text: `The 6-digit code to verify your email is ${otp}`
            }

            transporter.sendMail(mailOption, (error, info) => {
                if (error) { res.status(500) }
            })
            res.json("create");
        }
        else res.send("not");
    } catch (error) {
        res.status(404);
        res.send('not')
    }
});

const signinUser = asyncHandler(async (req, res) => {

    const form = req.body;
    const regIdNo = form.regIdNo;
    const password = form.password;

    try {
        const existingUser = await User.findOne({ regIdNo: regIdNo });
        if (existingUser) {
            const isPasswordValid = await bcrypt.compare(password, existingUser.password);

            if (isPasswordValid) {
                generateToken(res, existingUser._id)
                res.json("loginpass");
            } else {
                res.json("loginfail");
            }
            return;
        } else res.send("nouser");
    } catch (error) {
        res.status(404);
        res.json("fail");
    }

})

const sendEmail = asyncHandler(async (req, res) => {
    try {
        const form = req.body;
        const regIdNo = form.regIdNo;
        const otp = form.otp;

        const user = await User.findOne({ regIdNo: regIdNo });

        if (user.email) {
            const transporter = nodemailer.createTransport({
                service: "Gmail",
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.APP_PASS,
                },
            })

            const mailOption = {
                from: "One Pict",
                to: user.email,
                subject: "Password Reset",
                text: `The 6-digit code to reset your password is ${otp}`
            }

            transporter.sendMail(mailOption, (error, info) => {
                if (error) { res.json('fail'); }
                else res.json('pass');
            })
        } else {
            res.send("notexist")
        }
    } catch (error) {
        res.status(404)
        res.json('fail')
    }
})


const resetPass = asyncHandler(async (req, res) => {
    const password = req.body.password;
    const cookieVal = req.body.cookieVal;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.updateOne({ regIdNo: cookieVal }, { $set: { password: hashedPassword } })
        res.json("pass")
    } catch (error) {
        res.json("fail")
        res.status(404);

    }
})



const updateUserName = asyncHandler(async (req, res) => {
    const { cookieVal } = req.body;
    const { userNameUpdate } = req.body;

    try {
        await User.updateOne({ regIdNo: cookieVal }, { $set: { name: userNameUpdate } });
        res.json("pass");

    } catch (error) {
        res.json("fail");
        res.status(401);
    }
})


const getCurrentUserProfile = asyncHandler(async (req, res) => {
    const regIdNo = req.body.cookieVal;
    try {
        const user = await User.findOne({ regIdNo: regIdNo });
        if (user) {
            res.send(user.name);
        } else {
            res.send("not");
        }
    } catch (error) {
        res.json("fail");
        res.status(401);
    }
})



// Image Upload and retrive.


const getImage = asyncHandler(async (req, res) => {
    try {
        const image = await Image.find({}).catch((e) => {
            console.log(e)
        })

        if (image.length) {
            res.json(image);
        }
        else {
            res.json("nothing")
        }
    } catch (error) {
        res.json("fail");
        res.status(401);
    }

});


const postImage = asyncHandler(async (req, res) => {

    const { form } = req.body;
    const { cookieVal } = req.body;
    const productName = form.productName;
    const productPrice = form.productPrice;
    const description = form.description;
    const currentProductPrice = form.currentProductPrice;
    const images = form.img;
    const img = [];

    //Database Updation
    try {
        for (const i of images) {
            //Cloudinary Upload
            await uploadCloudinary(i).then((res) => {
                img.push(res.public_id);
            }).catch((e) => {
                res.json(e)
            });
        }
        const user = await User.findOne({ regIdNo: cookieVal })

        const newImageData = new Image(
            {
                regIdNo: cookieVal,
                productName: productName,
                productPrice: productPrice,
                description: description,
                currentProductPrice: currentProductPrice,
                contactInfo: user.email,
                img: img
            }
        )
        await newImageData.save()
        res.send("done")
    } catch (error) {
        res.json(error)
        res.status(404);
    }

});

const getUserImage = asyncHandler(async (req, res) => {
    const { regIdNo } = req.body;
    try {
        const image = await Image.find({ regIdNo: regIdNo });
        if (image.length) {
            res.json(image)
        } else {
            res.json('nothing')
        }
    } catch (error) {
        res.json("fail");
        res.status(401);
    }
});

const deleteUserImage = asyncHandler(async (req, res) => {

    const { _id } = req.body;
    try {
        const object = await Image.findOne({ _id: _id }).catch((e) => {
            console.log(e)
        })

        const image = object.img;

        await image.map(async (i) => {

            await deleteCloudinary(i).catch((e) => {
                console.log(e)
            })
        })
        await Image.deleteOne({ _id: _id }).catch((e) => {
            console.log(e)
        });
        res.json("success");
    } catch (error) {
        res.status(401)
        res.json(error);
    }

})

const getProductById = asyncHandler(async (req, res) => {
    const { _id } = req.body;

    const data = [];
    try {
        const imageInfo = await Image.findById({ _id: _id }).catch((e) => {
            console.log(e);
        })
        const user = await User.findOne({ regIdNo: imageInfo.regIdNo }).catch((e) => {
            console.log(e);
        })

        data.push(imageInfo);

        data.push(user.name)

        res.json(data);
    } catch (error) {
        res.json("fail");
        res.status(401);
    }

})


const postUserImg = asyncHandler(async (req, res) => {
    const { userImg } = req.body;
    const { cookieVal } = req.body;

    try {
        const imageRes = await uploadCloudinary(userImg).catch((e) => {
            throw new Error(`ERROR : ${e}`);
        });

        const newImageData = new userImage(
            {
                regIdNo: cookieVal,
                userImg: imageRes.public_id
            }
        )
        await newImageData.save()
        res.send("done")
    } catch (error) {
        res.send(error)
        res.status(500)
    }

})

const getUserProfileImage = asyncHandler(async (req, res) => {
    const { cookieVal } = req.body;

    try {
        const response = await userImage.findOne({ regIdNo: cookieVal });

        if (response)
            res.json(response);
        else {
            res.json("notexist");
        }
    } catch (error) {
        res.json(error)
        res.status(500)

    }
})


const deleteUserProfileImage = asyncHandler(async (req, res) => {
    const { imgSrc } = req.body;
    const { cookieVal } = req.body;
    try {
        await deleteCloudinary(imgSrc).catch((e) => {
            console.log(e);
        })
        await userImage.deleteOne({ regIdNo: cookieVal }).catch((e) => {
            console.log(e);
        });
        res.json("done");
    } catch (error) {
        res.send(error)
        res.status(404)
    }

})


const uploadEventInfo = asyncHandler(async (req, res) => {
    const { form } = req.body;
    const { cookieVal } = req.body;
    const eventName = form.eventName;
    const eventDate = form.eventDate;
    const eventInfo = form.eventInfo;
    const contactInfo = form.contactInfo;
    const images = form.eventImg;
    const img = [];

    //Database Updation
    try {

        for (const i of images) {
            //Cloudinary Upload
            const imageRes = await uploadCloudinary(i).catch((e) => {
                throw new Error(`ERROR : ${e}`);
            });
            img.push(imageRes.public_id);
        }
        const newEventData = new Events(
            {
                regIdNo: cookieVal,
                eventName: eventName,
                eventDate: eventDate,
                eventInfo: eventInfo,
                contactInfo: contactInfo,
                eventImg: img
            }
        )

        await newEventData.save()
        res.send("done")
    } catch (error) {
        console.log(error)
        res.send(error)
        res.status(404)
    }
})


const getEventInfo = asyncHandler(async (req, res) => {
    try {
        const event = await Events.find({}).catch((e) => {
            console.log(e)
        })

        if (event.length) {
            res.json(event);
        }
        else {
            res.json("nothing");
        }
    } catch (error) {
        res.json("fail");
        res.status(401);
    }
})

const getEventInfoById = asyncHandler(async (req, res) => {
    const { _id } = req.body;
    try {
        const data = await Events.findById({ _id: _id }).catch((e) => {
            console.log(e);
        })
        if (data)
            res.json(data);
        else res.json("not");
    } catch (error) {
        res.json("fail");
        res.status(401);
    }
})

const getEventInfoByRegIdNo = asyncHandler(async (req, res) => {
    const { regIdNo } = req.body;
    try {
        const data = await Events.find({ regIdNo: regIdNo }).catch((e) => {
            console.log(e)
        })

        if (data.length)
            res.json(data);
        else res.json("nothing")
    } catch (error) {
        res.json("fail");
        res.status(401);
    }
})

const deleteEvent = asyncHandler(async (req, res) => {

    const { _id } = req.body;
    try {
        const object = await Events.findOne({ _id: _id }).catch((e) => {

            console.log(e)
        })

        const image = object.eventImg;

        await image.map(async (i) => {

            await deleteCloudinary(i).catch((e) => {
                console.log(e)
                res.status(404)

            })
        })

        await Events.deleteOne({ _id: _id }).catch((e) => {
            console.log(e)
            res.status(404)

        });

        res.json("success");
    } catch (error) {
        res.json("fail");
        res.status(401);
    }
})



const postContactMsg = asyncHandler(async (req, res) => {
    const form = req.body;
    const name = form.name;
    const email = form.email;
    const message = form.message;
    try {
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.APP_PASS,
            },
        })

        const mailOption = {
            from: "One Pict",
            to: process.env.USER_EMAIL,
            subject: "Contact Us Query",
            text: `Query from ${name}.\n Mail Id : ${email}\nThe Message is ${message} .`
        }
        const mailToUser = {
            from: "One Pict",
            to: email,
            subject: "Contact Us Form Related",
            text: `Hi ${name},\nGreetings from One Pict!\nThankyou for contacting One Pict.\nWe will work on your message and let you know soon! Have a good day 😀.\nBest Regards,\nTeam One Pict`
        }


        transporter.sendMail(mailOption, (error, info) => {
            if (error) { res.json('fail'); }
            else res.json('done');
        })
        transporter.sendMail(mailToUser, (error, info) => {
            if (error) { res.json('fail'); }
        })
    } catch (error) {
        res.json("fail");
        res.status(401);
    }

})

const buyRequestToOwner = asyncHandler(async (req, res) => {
    const { buyerEmail } = req.body;
    const { ownerEmail } = req.body;
    const { productName } = req.body;
    try {
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.APP_PASS,
            },
        })

        const mailOption = {
            from: "One Pict",
            to: ownerEmail,
            subject: "Product Purchase Request from One Pict",
            text: `I hope this message finds you well. I am writing to place a purchase request on behalf of a member of our esteemed One Pict community.
    
    Buyer Email: ${buyerEmail}
    
    The buyer has expressed interest in ${productName}, and after careful consideration, they are eager to proceed with the purchase.
    
    Would you kindly facilitate the necessary steps to complete this transaction? If there are any additional details required or steps to be followed, please do not hesitate to ensure prompt communication with the buyer. You can contact buyer with buyer email provided.
    
    Thank you for your attention to this matter. We greatly appreciate your commitment to providing quality products and service to our community members.
    
    Warm regards,
    
    Team One Pict`
        };

        transporter.sendMail(mailOption, (error, info) => {
            if (error) { res.json('fail'); }
            else res.json('done');
        })
    } catch (error) {
        res.json("fail");
        res.status(401);
    }

});


const postDiscussMsg = asyncHandler(async (req, res) => {
    const { cookieVal } = req.body;
    const { discussMsg } = req.body;
    let image;
    try {
        const user = await User.findOne({ regIdNo: cookieVal }).catch((e) => {
            console.log(e);
        })


        const response = await userImage.findOne({ regIdNo: cookieVal });

        if (response)
            image = response.userImg
        else {
            image = "notexist"
        }


        const newDiscuss = new Discuss({
            regIdNo: cookieVal,
            discussMsg: discussMsg,
            date: Date.now(),
            name: user.name,
            like: 0,
            reply: 0,
            userImg: image,
            repliedTo: "self",
        })
        await newDiscuss.save();

        const data = await Discuss.find({ repliedTo: "self" }).sort({ _id: -1 }).catch((e) => {
            console.log(e)
        })
        if (data.length)
            res.json({
                message: "done",
                contain: data,
            });

    } catch (error) {
        res.send("fail");
        console.log(error)
        res.status(404)

    }

})


const discussInfo = asyncHandler(async (req, res) => {
    try {
        const data = await Discuss.find({ repliedTo: "self" }).sort({ _id: -1 }).catch((e) => {
            console.log(e)
        })
        if (data.length)
            res.json(data)
        else res.json('fail')
    } catch (error) {
        res.send("fail");
        console.log(error)
        res.status(404)

    }
})


const handleLike = asyncHandler(async (req, res) => {
    const { count } = req.body;
    const { _id } = req.body;
    const { regIdNo } = req.body;

    try {
        await Discuss.updateOne({ _id: _id }, { $inc: { like: count } });


        if (count === -1) {
            await Discuss.updateOne({ _id: _id }, { $pull: { likeBy: regIdNo } });

        }
        else if (count === 1) {
            await Discuss.updateOne({ _id: _id }, { $push: { likeBy: regIdNo } });

        }

        const data = await Discuss.findOne({ _id: _id }).catch((e) => {
            console.log(e)
        })


        if (data)
            res.json({
                message: "done",
                contain: data.like
            });


    } catch (error) {
        console.log(error)
        res.status(404)

    }
})

const deleteDiscussion = asyncHandler(async (req, res) => {
    const { _id, replyArray } = req.body;

    try {
        await Discuss.deleteMany({ regIdNo: { $in: replyArray }, repliedTo: _id });
        const data = await Discuss.findOne({ _id });
        if (!data) {
            return res.status(404).send("Discussion not found");
        }
        if (data.repliedTo !== 'self') {
            await Discuss.updateOne({ _id: data.repliedTo }, { $inc: { reply: -1 } });
            await Discuss.updateOne({ _id: data.repliedTo }, { $pull: { replyBy: data.regIdNo } });
        }
        await Discuss.deleteOne({ _id });
        res.status(200).send("Discussion deleted successfully");

    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while deleting the discussion");
    }
});


const replyDiscussion = asyncHandler(async (req, res) => {
    const { _id } = req.body;
    const { regIdNo } = req.body;
    const { replyMsg } = req.body;
    const { replyArray } = req.body;
    let image;

    try {

        await Discuss.updateOne({ _id: _id }, { $inc: { reply: 1 } });

        await Discuss.updateOne({ _id: _id }, { $push: { replyBy: regIdNo } });


        const response = await userImage.findOne({ regIdNo: regIdNo });

        if (response)
            image = response.userImg
        else {
            image = "notexist"
        }

        const user = await User.findOne({ regIdNo: regIdNo }).catch((e) => {
            console.log(e);
        })

        const replyRes = new Discuss({
            regIdNo: regIdNo,
            discussMsg: replyMsg,
            date: Date.now(),
            name: user.name,
            userImg: image,
            like: 0,
            reply: 0,
            repliedTo: _id,
        })

        await replyRes.save();

        const data = await Discuss.find({ regIdNo: { $in: replyArray }, repliedTo: _id }).sort({ _id: -1 }).catch((e) => {
            console.log(e);
        })

        if (data) res.json({ message: "done", contain: data });

    } catch (error) {
        console.log(error)
        res.status(404)

    }
})

const getReply = asyncHandler(async (req, res) => {

    const { replyArray } = req.body;
    const { _id } = req.body;

    try {
        const response = await Discuss.find({ regIdNo: { $in: replyArray }, repliedTo: _id }).sort({ _id: -1 }).catch((e) => {
            console.log(e);
        })
        if (response.length) res.json(response);
        else res.send("fail");
    } catch (error) {
        res.send("fail");

        console.log(error)
        res.status(404)

    }

})


const postNoteById = asyncHandler(async (req, res) => {
    const { cookieVal } = req.body;
    const { subName } = req.body;
    const { section1 } = req.body;
    const { section2 } = req.body;
    const { addLi1 } = req.body;
    const { addLi2 } = req.body;
    let image;

    try {
        const user = await User.findOne({ regIdNo: cookieVal });
        const response = await userImage.findOne({ regIdNo: cookieVal });

        if (response)
            image = response.userImg
        else {
            image = "notexist"
        }

        if (!user.regIdNo.includes("T")) res.send("Invalid Access");
        else {
            const newNote = new Note({
                regIdNo: cookieVal,
                teacherName: user.name,
                image: image,
                subName: subName,
                section1: section1,
                section2: section2,
                addLi1: addLi1,
                addLi2: addLi2
            })
            await newNote.save();

            res.send("success")
        }
    } catch (error) {
        res.send("error")
        console.log(error)
    }

})

const getNotesById = asyncHandler(async (req, res) => {

    try {
        const response = await Note.aggregate([
            {
                $group: {
                    _id: "$regIdNo",
                    document: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$document" }
            }
        ]);

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json(error);
    }
})


const notesById = asyncHandler(async (req, res) => {
    const { regIdNo } = req.body

    try {
        const response = await Note.find({ regIdNo });
        res.status(201).json(response);
    } catch (error) {
        res.status(500).json(error);

    }
})


const addAnnouncement = asyncHandler(async (req, res) => {
    const { form, cookieVal, notify } = req.body;
    const title = form.title;
    const message = form.message;
    const link = form.link;
    const images = form.img;
    let teacherImg;

    const img = []
    try {
        const user = await User.findOne({ regIdNo: cookieVal });
        const response = await userImage.findOne({ regIdNo: cookieVal });
        if (response)
            teacherImg = response.userImg
        else {
            teacherImg = "notexist"
        }

        if (images.length) {
            for (const i of images) {
                //Cloudinary Upload
                const imageRes = await uploadCloudinary(i).catch((e) => {
                    console.log(e);
                });
                img.push(imageRes.url);
            }
        }
        if (notify) {
            const emailUser = await User.find(
                {
                    regIdNo: {
                        $regex: "^[ICE].*",
                    }
                },
                {
                    email: 1,
                    _id: 0
                }
            )
            const transporter = nodemailer.createTransport({
                service: "Gmail",
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.USER_EMAIL,
                    pass: process.env.APP_PASS,
                },
            })
            emailUser.map((email) => {

                const mailOption = {
                    from: "One PICT",
                    to: email,
                    subject: `Announcement: ${title}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <h2 style="color: #0056b3; font-size: 24px;">${title}</h2>
                            <p style="font-size: 16px; margin: 10px 0;">${message}</p>
                            ${link ? `<p style="font-size: 16px; margin: 10px 0;">For more details, visit: <a href="${link}" style="color: #0056b3; text-decoration: none;">${link}</a></p>` : ''}
                            ${img.map(img => `
                            <img src="${img}" alt="Announcement Image" style="max-width: 100%; height: auto; margin-top: 20px; border: 1px solid #ddd; padding: 5px;" />
                            `).join('')}
                        </div>
                    `
                }

                transporter.sendMail(mailOption, (error, info) => {
                    console.log(error);
                })
            })


        }
        if (!user.regIdNo.includes("T")) res.send("Invalid Access");
        else {


            const announcement = new Announcement({
                regIdNo: cookieVal,
                teacherName: user.name,
                teacherImg: teacherImg,
                title: title,
                message: message,
                link: link,
                img: img
            })
            await announcement.save();
            res.status(201).json(response);
        }

    } catch (error) {
        console.log(error)
    }

});

const getAnnouncement = asyncHandler(async (req, res) => {
    try {
        const data = await Announcement.find({}).sort({ _id: -1 });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json(error)
    }

})

const getAnnouncementById = asyncHandler(async (req, res) => {
    const { _id } = req.body;
    try {
        const data = await Announcement.findById({ _id });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json(error)
    }
})


export { createUser, signinUser, getImage, postImage, getCurrentUserProfile, sendEmail, resetPass, getUserImage, deleteUserImage, getProductById, postUserImg, getUserProfileImage, deleteUserProfileImage, updateUserName, uploadEventInfo, getEventInfo, getEventInfoById, getEventInfoByRegIdNo, deleteEvent, postContactMsg, buyRequestToOwner, postDiscussMsg, discussInfo, handleLike, deleteDiscussion, replyDiscussion, getReply, postNoteById, getNotesById, notesById, addAnnouncement, getAnnouncement, getAnnouncementById };