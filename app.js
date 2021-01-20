const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const childProcess =  require('child_process');
var fs = require('fs');
const multer = require("multer");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname,"views"))

var videos = ["/videos/video1.mp4",  "/videos/video2.mp4", "/videos/video3.mp4"]
var videos_thumbnails = ["", "", ""]

var name = ""
var storage_vid = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/videos")
    },
    filename: function (req, file, cb) {
      name = "video" + (videos.length + req.files.length) + ".mp4";
      console.log(name);
      cb(null, name)
    }
  })

var upload_vid = multer({
    storage: storage_vid,
    fileFilter: function (req, file, cb){
        var filetypes = /mp4/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        else{
          cb("Error: File upload only supports the " + "following filetypes - " + filetypes);
              }
      }
}).array("video");


app.get("/", function(req, res) {
  res.render("index", {videos: videos, thumbnails: videos_thumbnails, code: null });
});

app.get("/iframePage", function(req, res) {
  res.sendFile(__dirname + "/iframePage.html");
});

app.post("/uploadVideo", function (req, res, next) {

    upload_vid(req, res, (err) => {
        if(err) {
            res.send(err)
        }
        else {
          const files = req.files;
          // Loop through all the uploaded images and display them on frontend
          for (let index = 0; index < files.length; ++index) {
            var path = files[index].path.split("\\");
            videos.push("/" + path[1] + "/" + path[2]);
            videos_thumbnails.push("");
          }
          res.render("index", {videos: videos, thumbnails: videos_thumbnails, code: null });
        }
    });
});

app.post("/", (req, res) => {

  var html_head = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<link rel=\"stylesheet\" href=\"https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css\" integrity=\"sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4\" crossorigin=\"anonymous\">\n<title>Blackbox</title>\n</head>\n<body>\n"
  var html_foot = "</body>\n</html>"

  var html_body = ""

  for(let i = 0; i<videos.length; i++) {
    html_body = html_body + "<video id=\"videoPlayer\" poster=\"" + videos_thumbnails[i] + "\" width=\"360\" height=\"240\" controls>\n<source src=\"" + videos[i] + "\" type=\"video/mp4\" />\n</video>\n"
   }
   var html_file = html_head + html_body + html_foot

     fs.writeFile('iframePage.html', html_file, function (err) {
     if (err) throw err;
   });

  var html_file = "/iframePage"
  var code = __dirname + html_file
  res.render("index", {videos: videos, thumbnails: videos_thumbnails, code: code });

});

app.post("/thumbnails", (req, res) => {
  var videoNumber = req.body.vid;
  var t1 = Number(req.body.time);

  var time = "";
  for (let i=2; i>=0; i--) {
  	n1 = Math.floor(t1/Math.pow(60, i))
  	if (i!=0) {
  		if (n1/10<1) {
	  	time = time + '0' + n1 + ":";
	  	} else {
	  	time = time + "" + n1 + ":";
	  	}
  	} else {
  		n1 = Math.floor(t1%60)
  		if (n1/10<1) {
	  	time = time + '0' + n1;
	  	} else {
	  	time = time + "" + n1;
	  	}
  	}
  }

  // if (name){
  var thepath = '/public/videos/video' + videoNumber + '.mp4';
  pathToFile = path.join(__dirname, thepath);
  var newImName = "image" + videoNumber + ".jpg";
  pathToOutput = path.join(__dirname, '/public/thumbnails/', newImName);
  videos_thumbnails[videoNumber - 1] = '/thumbnails/' + newImName
  childProcess.exec("rm " + pathToOutput);
  childProcess.exec(("ffmpeg -i " + pathToFile + " -ss " + time + " -r 1 -an -vframes 1 -f mjpeg " + pathToOutput), function(err) {
  res.render("index", {videos: videos, thumbnails: videos_thumbnails, code: null });
  });
  // } else {
  // 	res.send("No File was uploaded");
  // }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
