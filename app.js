//My Books Webside js

var express = require("express");
var path = require("path");
var pg = require("pg");
var bodyParser = require("body-parser");
var session = require("express-session");
var books = require("google-books-search");




var CON_STRING = "postgres://hjrbveopylyfxu:5df3e165b3eaefa6529dca0a624a486cac4ccde581647ec6b27055358a67a2f9@ec2-54-247-171-30.eu-west-1.compute.amazonaws.com:5432/daabkbjibff3lt";
// process.env.DB_CON_STRING; 
if (CON_STRING == undefined) {
    console.log("Error: Environment variable DB_CON_STRING not set!");
    process.exit(1);
}

pg.defaults.ssl = true;
var dbClient = new pg.Client(CON_STRING);
dbClient.connect();

var urlencodedParser = bodyParser.urlencoded({
    extended: false
});

const PORT = 3000;

var app = express();

//turn on serving static files (required for delivering css to client)
app.use(express.static(path.join(__dirname, 'public')));
//configure template engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug")


app.use(session({
    secret: "This is a secret!",
    cookie: {
    maxAge: 3600000
    },
    resave: true,
    saveUninitialized: false
}));


//---------------------navbar/login----------------------------------------------------------

app.get("/", function (req, res) {
        
    
    dbClient.query("SELECT * FROM users", function (dbError, dbResponse) {
        
        if(req.session.userID != undefined)
        {
            res.render("index",{userID: req.session.userID});
        } else 
        {
            res.render("index");
        }
                   
    });
});

app.post("/", urlencodedParser, function (req, res) {
    var user = req.body.user_name;
    var password = req.body.password;

    dbClient.query("SELECT * FROM Users WHERE user_name=$1 AND user_pw=$2", [user, password], function (dbError, dbResponse) {

        if (dbResponse.rows.length == 0) {

            res.render("", { login_error: "Sorry, username and password do not match!"});
            
        } else {
            
            initSession(req.session);
            req.session.userID.push(user);
            res.render("index", {userID: req.session.userID});
        }
    });
});

//----------------------------sessions-log-in -----------------------------------------------


function initSession(session) {
    if (session.userID == undefined) {
        session.userID = [];
    }
}

//--------------------------log-out---------------------------------------------------------

app.post("/logout", urlencodedParser, function(req,res){            
    req.session.destroy(function(err) {
            res.render("index");
    });
})
//-------------------------search-----------------------------------------------------------



app.get("/searchresult", function (req, res) {

    res.redirect("/");
});

app.post("/searchresult", urlencodedParser, function (req, res) {
    var search = req.body.searchbar;
    var search2='%'+search+'%'

    dbClient.query("SELECT * From books WHERE isbn=$1 OR title ILIKE $2 OR author ILIKE $3", [search,search2,search2], function (dbError, dbResponse) {

        if (dbResponse.rows.length > 0) {

            var book;
            if (dbResponse.rows.length == 1) {
                book = "Book";
            } else {
                book = "Books";
            }
            
            res.render("searchresult", { searchedbooks: dbResponse.rows, result: "We have found " + dbResponse.rows.length + " " + book + " that match", userID: req.session.userID});

        } else {

            res.render("searchresult", {searchedbooks: dbResponse.rows, userID: req.session.userID } );
        }

    });

});

//-------------------------Register---------------------------------------------------------


app.get("/Register", function (req, res) {

    res.render("Register");

});

app.post("/Register", urlencodedParser, function (req, res) {

    var user = req.body.reg_name;
    var pw = req.body.reg_password;
    var con_pw = req.body.confirm_password;
        
   
    if (user != undefined && pw != undefined && con_pw != undefined) {


        dbClient.query("SELECT * FROM Users WHERE user_name=$1", [user], function (dbError, dbResponse) {

            //console.log(dbResponse.rows.length);
            if (pw != con_pw) {
                res.render("Register", {
                    Error_Reg_pw: "The passwords doesn't match!"
                });
            } else if (dbResponse.rows.length > 0) {
                res.render("Register", {
                    Error_Reg_name: "This user name exist already! Please choose a diffrent name!"
                });
            } else {

                dbClient.query("INSERT INTO Users (user_name,user_pw) VALUES($1,$2)", [user, pw], function (dbERR, dbRESP) {

                    res.render("", { INFO_SIGN: "You joined My Book Store!"});
                });
            }
        });
        
    } else {
        res.render("Register");
    }
});


//---------------------------Books-Detail---------------------------------------------------

app.get("/detail/:id", function (req, res) {

    
    var book_id = req.params.id;
            dbClient.query("SELECT * FROM books WHERE id_books=$1", [book_id], function (dbError, dbResult) {
                var isbn = dbResult.rows[0].isbn;
                    dbClient.query("SELECT * FROM critic WHERE book_id=$1", [book_id], function(dbErrorCritic, dbResultCritic){
                        
                        dbClient.query("SELECT AVG(rating) FROM critic WHERE book_id=$1", [book_id], function(dbErr_AVG, dbResAVG) {
                                    books.search(isbn, function (errbook, resbook) {
                                        if (resbook.length > 0) // did it found something ?   
                                        {      var found=false;     //for the found results if noone of them match to the isbn number 
                                            for (var i = 0; i < resbook.length; i++) // iterrate through the found books from the googe api 
                                            {
                                                var isbns_lengh = resbook[i].industryIdentifiers.length;
                                                    
                                                for ( var j=0 ; j < isbns_lengh; j++) {
                                                    if (isbn == resbook[i].industryIdentifiers[j].identifier) {                 // search for isbns that match       
                                                        found=true;
                                                        res.render("detail", { bookdata: dbResult.rows[0], googlebookapi: resbook[i], userID: req.session.userID, critic: dbResultCritic.rows, avg :  dbResAVG.rows[0].avg});

                                                    }     
                                                }           
                                             } 
                                         
                                            if(found==false) // render notfound img and description if the isbn of all found objects doesn't match
                                                {
                                                    res.render("detail", { bookdata: dbResult.rows[0], googlebookapi: notfound,userID: req.session.userID, critic: dbResultCritic.rows, avg : dbResAVG.rows[0].avg});        
                                                    
                                                }

                                        } else {
                                                            // nothing was found render with notfound
                                            res.render("detail", { bookdata: dbResult.rows[0], googlebookapi: notfound,userID: req.session.userID,critic: dbResultCritic.rows, avg : dbResAVG.rows[0].avg });
                                        }
                                    });
                            });   
                    });    
            }); 
    
});


app.post("/detail/:id", urlencodedParser, function (req, res) {
    
    var book_id = req.params.id;
       
    res.redirect("../detail/"+book_id);
});

var notfound = new Object();
notfound.description = "No description available!";
notfound.thumbnail = "http://www.gladessheriff.org/media/images/most%20wanted/No%20image%20available.jpg";

//--------------------------------------Post-Critic-------------------------------------

app.get("/postCritic/:id", function(req, res){
    var id_book=req.params.id;
    if(req.session.userID != undefined)
    {
        var name = req.session.userID[0];       
        
        dbClient.query("SELECT * FROM critic WHERE user_name=$1 AND book_id=$2",[name,id_book],function(errName,resName){

            if(resName.rows.length >0)
            {   
                 res.render("postCritic",{ userID: req.session.userID, id_book: req.params.id, allreadyPosted: "You allready Posted a critic for this Book!"});   
                    
            } else {
                
                res.render("postCritic",{ userID: req.session.userID, id_book: req.params.id});    
            }
        });
        
    } else {
        
        res.render("postCritic",{ userID: req.session.userID, id_book: req.params.id}); 
        
    }
                
                   
           
});

app.post("/postCritic/:id", urlencodedParser, function(req, res){
    
    var Critic=req.body.Critic;
    var id_book=req.params.id;
    var user_name=req.session.userID[0];
    var rating=req.body.rate;
            dbClient.query("INSERT INTO critic (text, user_name , book_id, rating) VALUES ($1,$2,$3,$4)",[Critic,user_name,id_book,rating],function(dbErrorCritic, dbResCritic){
                res.redirect("../detail/"+id_book);
            });

});

//-------------------------------------Port-massage---------------------------------------

app.listen(PORT, function () {
    console.log(`Books App listening on Port ${PORT}`);
});

