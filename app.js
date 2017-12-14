/**
/*
 *  Licensed to the Apache Software Foundation (ASF) under one
 *  or more contributor license agreements.  See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership.  The ASF licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 * node-zk-browser
 * author :dennis (killme2008@gmail.com)
 *
 */

var express = require('express');
require('express-namespace');
var path=require('path');
var fs=require('fs');
var util=require('util');
var ZkClient=require('./zk.js').ZkClient;

var port = process.env.ZK_BROWSER_PORT || 5000;
var host = process.env.ZK_HOST || '192.168.0.221:1181';
var zkclient = new ZkClient(host);
var users = JSON.parse(fs.readFileSync(path.join(__dirname,'user.json'), 'utf8'));
var app = express();

process.on('uncaughtException', function (err) {
  console.error('Caught exception: ' + err);
});


// Configuration
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.cookieParser());
	app.use(express.session({ secret: "node zk browser" }));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res){
	res.redirect("/node-zk");
});

app.namespace("/node-zk",function(){

	//index
	app.get('/', function(req, res){
		res.render('index', { });
	});

	//display tree
	app.get('/tree', function(req, res){
		var path=req.query.path || "/";
		res.render('tree', {layout:false,'path':path, 'host':host});
	});

	//login
	app.post("/login",function(req,res){
		var user=req.body.user;
		if(users[user.name]==user.password){
			req.session.user=user.name
			req.session.cookie.maxAge=5*60*1000;
		}
		res.redirect(req.header('Referer'));
	});

	//delete
	app.post("/delete",function(req,res){
		if(req.session.user){
			var path=req.body.path;
			var version=Number(req.body.version);
			zkclient.remove(path,version,function(err){
				if(err) {
					res.send(err);
				} else {
					res.send("Delete ok");
				}
			});
		}else{
			res.send("Please logon");
		}
	});

	//create view
	app.get("/create",function(req,res){
		res.render("create",{layout:false,user: req.session.user});
	});

	//create
	app.post("/create",function(req,res){
		if(req.session.user){
			var path=req.body.path;
			var data=req.body.data;
			var flag=Number(req.body.flag);
			zkclient.create(path,data,flag,function(err,path){
				if(err)
					res.send(err);
				else
					res.send("Create ok");
			});
		}else{
			res.send("Please logon");
		}
	});

	//edit
	app.post("/edit",function(req,res){
		if(req.session.user){
			var path=req.body.path;
			var new_data=req.body.new_data;
			var version=Number(req.body.version);
			zkclient.setData(path,new_data,version,function(err,stat){
				if(err){
					res.send(err);
				}else
					res.send("set ok");
			});
		}else{
			res.send("Please logon");
		}
	});

	//query data
	app.get("/get",function(req,res){
		var path=req.query.path || "/";
		zkclient.getData(path,null,function(err,data,stat){
			if(err){
				res.send('this node has no children');
			}else{
				path = decodeURIComponent(path);
				res.render("data",{ layout: false, 'stat':stat,'data':data,'path':path,'user': req.session.user});
			}
		});
	});

	//query children
	app.get('/children',function(req,res){
		var parenPath=req.query.path || '/';
		zkclient.getChildren(parenPath,null,function(error,children, stats){
			res.header("Content-Type","application/json");
			var result=[];
			if(!error){
				children.forEach(function(child){
					realPath=path.join(parenPath, encodeURIComponent(child));
					result.unshift({
						attributes:{"path":realPath,"rel":"chv"},
						data:{
							title : child,icon:"ou.png", attributes: { "href" : ("/node-zk/get?path="+realPath) }
						},
						state:"closed"
					});
				});
			}
			res.send(result);
		});
	});
});

app.listen(port);
console.log("Express server listening on port %d", port);
