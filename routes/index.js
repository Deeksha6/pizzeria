var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Cart = require('../models/cart')
var router = express.Router();
var monk = require('monk');
var db = monk('localhost:27017/pizza_orders');
var path=require('path');
var JSAlert = require("js-alert");

global.user='';
global.pic='';
//var myModule=require('../public/javascripts/pizzeria');
/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("dont know whats going on");
  res.render('index', { user : req.user });
});

router.get('/trial', function(req, res, next) {
  console.log("still dont know whats going on");
  res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
      res.render('register', { });
  });

  router.post('/register', function(req, res) {
    var pwd = req.body.password;
    var strongRegex = new RegExp("^(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$", "g");
    if(!strongRegex.test(pwd)){
      res.send("Password must contain caps, small letters, digits and special characters");
    }
    else{
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
           return res.render('register', { account : account });
           //res.send('Username is already registered');
        }

        passport.authenticate('local')(req, res, function () {
          res.redirect('/#/trial');
        });
    });
    }
  });

  router.get('/login', function(req, res) {
      res.render('login', { user : req.user });

  });

  router.post('/login', passport.authenticate('local'), function(req, res) {
  	  global.user=req.body.username;
      var collection = db.get('cart');
  	  if (global.user == "admin"){
  	  	res.redirect('/');
  	  }
      else{
        req.session.user=global.user;
        collection.find({user : req.session.user}, function(err, row){
        if (err) throw err;
        //ind = req.params.id;
        var arr = [];
        //for(var id in row[0]["cart"].items){
          //arr.push(row[0]["cart"].items[id]);
        //}
        if(row[0] && row[0]["cart"]){
          var cart = new Cart(row[0]["cart"]);
          //req.session.cart={item : row[0]["cart"].items[id],qty:row[0]["cart"].totalQty,price:row[0]["cart"].totalPrice};
         // console.log("cart : "+arr);
          //console.log(req.session);
          req.session.cart = cart;
          
        }
        //else{
          //req.session.cart={};
        //}
      	res.redirect('/#/trial');
      });
    }
      
  });

  

  router.get('/logout', function(req, res) {
      req.logout();
     
     
     var collection=db.get('cart');
    // collection.insert({
    //  user : req.session.user,
     // cart : req.session.cart
     //});
     collection.findOneAndUpdate(
        {user:req.session.user},
        {user:req.session.user, cart :req.session.cart},
        {upsert: true}
       );
     req.session.destroy();
     res.redirect('/');
     //console.log(req.session);
     });
  
  

  router.get('/ping', function(req, res){
      res.send("pong!", 200);
  });
 
 router.get('/add-to-cart/:id',function(req,res){
 	var productid = req.params.id;
 	var cart = new Cart(req.session.cart ? req.session.cart : {});
 	var collection = db.get('pizzas');
 	var prod = {};
  collection.find({ $and : [{isDelete : "False"},{_id : productid}]}, function(err, pizzas){
    if (err) throw err;
      prod = pizzas[0];
      console.log("here :"+prod);
      if(prod.available>0){
        cart.add(prod, productid);
        req.session.cart = cart;
          collection.update({
            _id: req.params.id
        },
        {
            name: prod.name,
            description: prod.description,
            category : prod.category,
            available: Number(prod.available-1), 
            price : Number(prod.price),
            isDelete: "False",
            picture : prod.picture
        }, function(err, pizza){
            if (err) throw err;
            //res.json(pizza);
            res.redirect('/#/trial');
        });
      }
      else{
        res.end("pizza not available");
        //JSAlert.alert("Pizza not available.");
      }
    //console.log(req.session);
    });
 });


router.get('/view-cart', function(req, res){
    //var collection = db.get('cart');
    //collection.find({user:req.session.user}, function(err, cart){
       // item
    //});

    if(!req.session.cart){
      console.log("blah blah");
      res.render('cart', { item : null});
    }
    var cart = new Cart(req.session.cart);
    //console.log("sessioncart : "+req.session.cart);
    //res.json(req.session.cart);
    res.render('cart', { item : cart.generateArray(),qty:cart.totaQty,price:cart.totalPrice});
    //res.render('pay');

  });

router.get('/payment', function(req, res){
    //res.render('pay');
    

      var collection = db.get('cart');
      var collection1 = db.get('wishlist');

      console.log("user : "+req.session.user);
      collection1.insert({
        user : req.session.user,
        cart : req.session.cart
      });

      //console.log(req.session.cart);

      collection.remove({ "user" : req.session.user},function(err) {
              if (err) {
                  console.log(err)
              } else {
                  console.log("success");
              }
      } );



    
   //var collection = db.get('cart');
   collection.findOne({ user:req.session.user }, function(err, item){
        if (err) throw err;
        res.render('pay');
    });
  req.session.cart=null;
    
});

router.get('/add/:id', function(req, res){
   var unit=0,qt=0,cost=0, prod={};
  var collection = db.get('pizzas');
  //var cart = new Cart(req.session.cart);
  console.log(req.session.cart);
  collection.find({ _id: req.params.id }, function(err, pizza){
      if (err) throw err;
      prod= pizza[0];
      console.log("prod : "+prod);
      if(prod.available > 0){

        for(var pizza in req.session.cart.items){
         //console.log("blah : "+req.session.cart.items[pizza].item.name); 
         //console.log(req.params.id);
          if (pizza==req.params.id){
          //console.log("compared");

          qt=req.session.cart.items[pizza].qty;
     
          cost=req.session.cart.items[pizza].price;
          unit=cost/qt;
          qt++;
          req.session.cart.items[pizza].qty=qt;
          req.session.cart.items[pizza].price=(unit*qt);
          console.log("trial :"+req.session.cart.totalQty);
          req.session.cart.totalQty++;
          req.session.cart.totalPrice=req.session.cart.totalPrice+unit;
          collection.update({
              _id: req.params.id
          },
          {
              name: prod.name,
              description: prod.description,
              category : prod.category,
              available: Number(prod.available-1), 
              price : Number(prod.price),
              isDelete: "False",
              picture : prod.picture
          }, function(err, pizza){
              if (err) throw err;
              //res.json(pizza);
              res.redirect('/view-cart');
              console.log("total quan : "+req.session.cart.totalQty);
          });
      
         }

        }
     }else{
          res.send("pizza not available");
      }
    });


});


router.get('/delete/:id', function(req, res){
  var unit=0,qt=0,cost=0;
  var collection = db.get('pizzas');
  var prod ={};
  for(var pizza in req.session.cart.items){
     if (pizza==req.params.id){
      qt=req.session.cart.items[pizza].qty;
      unit=req.session.cart.items[pizza].price;
      prod = req.session.cart.items[pizza];
      console.log("delete in for:"+ prod);
      delete req.session.cart.items[pizza];
     }

   }
   req.session.cart.totalPrice=req.session.cart.totalPrice-unit;
   req.session.cart.totalQty=req.session.cart.totalQty-qt;
   console.log("delete :"+ prod);
  collection.find({ $and : [{isDelete : "False"},{_id : req.params.id}]}, function(err, pizzas){
  if (err) throw err;
  prod = pizzas[0];
  console.log("here :"+prod);
      collection.update({
        _id: req.params.id
    },
    {
        name: prod.name,
        description: prod.description,
        category : prod.category,
        available: Number(prod.available+qt), 
        price : Number(prod.price),
        isDelete: "False",
        picture : prod.picture
    }, function(err, pizza){
        if (err) throw err;
    });
    });
    res.redirect('/view-cart');
    console.log("total quan : "+req.session.cart.totalQty);
});

router.get('/minus/:id', function(req, res){
  
  //var collection = db.get('cart');
  var unit=0,qt=0,cost=0;
  var collection = db.get('pizzas');
  //var cart = new Cart(req.session.cart);
  console.log(req.session.cart);
  for(var pizza in req.session.cart.items){
     //console.log("blah : "+req.session.cart.items[pizza].item.name); 
     //console.log(req.params.id);
     if (pizza==req.params.id){
      //console.log("compared");

      qt=req.session.cart.items[pizza].qty;
      if(qt==1){
        unit=req.session.cart.items[pizza].price;
        delete req.session.cart.items[pizza];

      }else{
      cost=req.session.cart.items[pizza].price;
      unit=cost/qt;
      qt--;
      req.session.cart.items[pizza].qty=qt;
      req.session.cart.items[pizza].price=(unit*qt);
    }
      console.log("trial :"+req.session.cart.totalQty);
      req.session.cart.totalQty--;
      req.session.cart.totalPrice=req.session.cart.totalPrice-unit;
      collection.find({ $and : [{isDelete : "False"},{_id : req.params.id}]}, function(err, pizzas){
        if (err) throw err;
        prod = pizzas[0];
        console.log("here :"+prod);
            collection.update({
              _id: req.params.id
          },
          {
              name: prod.name,
              description: prod.description,
              category : prod.category,
              available: Number(prod.available+1), 
              price : Number(prod.price),
              isDelete: "False",
              picture : prod.picture
          }, function(err, pizza){
              if (err) throw err;
          });
      //console.log(req.session);
      });
      res.redirect('/view-cart');
      console.log("total quan : "+req.session.cart.totalQty);
      //console.log("quan :"+req.session.cart.items[pizza].qty);
      
     }

    }
  });


router.get('/trialupload', function (req, res) { 
    //res.sendFile(__dirname + "/pizza-form.html"); 
    //res.redirect('/');
    console.log("dont sing");
   // res.render('layout');

    

}); 
  
router.post('/trialupload', function (req, res) { 
  if(!req.files){
     res.send("No file uploaded");
  }else{
    console.log("pic : "+req.files.file.name);
    var file=req.files.file;
    var extension = path.extname(file.name);
    if(extension !== ".png" && extension !== ".gif" && extension !== ".jpg"){
        res.send("Only images are allowed");
    }
    else
    {
      file.mv("C:\\Users\\Sn\\Desktop\\pizzeria\\public\\images\\uploads\\"+file.name,function(err){
        if (err) { 
            return res.send("Something went wrong!");
          }
        //console.log('req.session : '+ req.header('Referer'));
        //req.session.pic=file.name;
        //console.log("trial session : "+req.session.pic);
        //redirectUrl = req.header('Referer');
       res.send("success");
        global.pic=req.files.file.name;
        console.log(global.pic);
        //res.redirect(redirectUrl);
    });

   }
    }    
}); 


router.get('/saved', function(req, res) {
    var collection = db.get('wishlist');
    collection.find({user : req.session.user}, function(err, saved){
        if (err) throw err;
        var arr = [];
        for (var ele in saved){
          //console.log("elev :"+ele);
          for(var id in saved[ele].cart.items){
          arr.push(saved[ele].cart.items[id]);
        }
          //arr.push(saved[ele].cart.items);
        
        console.log("array : "+arr);
         
    }

    res.json(arr);
  });
});



module.exports = router;
