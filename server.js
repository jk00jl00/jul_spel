var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});



//Game vars
var lastPlayderID = 0;
var DIRS = {
    right: 0,
    down: 1,
    left: 2,
    up: 3 
};
const KEYS = {
  up: 40,
  right: 39,
  down: 38,
  left: 37
};
var players = [];
var apples = [{x: randomInt(0,30), y: randomInt(0,30), respawn : function(){
    this.x = randomInt(0,30);
    this.y = randomInt(0,30);   
    }
},
{x: randomInt(0,30), y: randomInt(0,30), respawn : function(){
    this.x = randomInt(0,30);
    this.y = randomInt(0,30);   
    }
},
{x: randomInt(0,30), y: randomInt(0,30), respawn : function(){
    this.x = randomInt(0,30);
    this.y = randomInt(0,30);   
    }
},
{x: randomInt(0,30), y: randomInt(0,30), respawn : function(){
    this.x = randomInt(0,30);
    this.y = randomInt(0,30);   
    }
}];
var gridSize = 30;



server.listen(3000,function(){
    console.log('Listening on '+server.address().port);
});

io.on('connection',function(socket){
    socket.player = {
        con: socket.request.connection.remoteAddress,
        id: lastPlayderID++,
        x: randomInt(0,20),
        y: randomInt(0,20),
        dir: randomInt(0,3),
        tail: [],
        move : function(){
            // Update tail
            for(var i = this.tail.length-1; i >= 0; i--) {
              this.tail[i].x = (i===0) ? this.x : this.tail[i-1].x;
              this.tail[i].y = (i===0) ? this.y : this.tail[i-1].y;
            }

            // Move head
            switch(this.dir) {
              case DIRS.right:
                this.x++; break;
              case DIRS.left:
                this.x--; break;
              case DIRS.down:
                this.y--; break;
              case DIRS.up:
                this.y++; break;
            }

            // Check boundaries
            if(this.x > gridSize-1) this.x = 0;
            if(this.x < 0) this.x = gridSize-1;
            if(this.y > gridSize-1) this.y = 0;
            if(this.y < 0) this.y = gridSize-1;

            // Collission detection
            this.checkCollisions();
        },
        checkCollisions: function() {
            // With other snakes (including ours)
            players.forEach((s) => {
              // Heads except ourself
              if(s !== this) {
                if(s.x === this.x && s.y === this.y) {
                  // The bigger survives
                  // ToDo: 3 outcomes
                  // - Same length = both die
                  if(s !== this && this.tail.length < s.tail.length) {
                    this.respawn();
                  } else {
                    for(let i = 0; i < s.tail.length + 1; i++){
                        this.addTail();
                    }
                    s.respawn();
                  }
                }
              }
              // Tails
              if(s !== this)
                  s.tail.forEach((t) => {
                    if(t.x === this.x && t.y === this.y) {    
                        let a = s.tail.splice(s.tail.indexOf(t));
                        console.log(a);
                        for(let i = 0; i < a.length + 1; i++){
                            this.addTail();
                        }
                        
                        s.tail.splice(s.tail.indexOf(t));
                      
                    }
                  });
            });
            // With apples
            apples.forEach((a) => {
              if(a.x === this.x && a.y === this.y) {
                this.addTail();
                a.respawn();
              }
            });
        },
        respawn : function(){
            this.x = randomInt(0,20);
            this.y = randomInt(0,20);
            this.dir = randomInt(0,3);
            this.tail = [];
            socket.player.addTail();
            socket.player.addTail();
        },
        addTail : function(){
            this.tail.push({x: this.x, y: this.y});
        }
    };
    socket.player.addTail();
    socket.player.addTail();
    players.push(socket.player);
    socket.emit('allplayers', socket.player);

    socket.on('keyDown',function(key){
        switch (key) {
            case KEYS.up:
            if (socket.player.dir !== DIRS.down)
                socket.player.dir = DIRS.up; break;
          case KEYS.right:
            if (socket.player.dir !== DIRS.left)
                socket.player.dir = DIRS.right; break;
        case KEYS.down:
            if (socket.player.dir !== DIRS.up)
                socket.player.dir = DIRS.down; break;
        case KEYS.left:
            if (socket.player.dir !== DIRS.right)
                socket.player.dir = DIRS.left; break;
        }
    });

    socket.on('disconnect',function(){
        console.log("bop");
        let i = players.indexOf(socket.player);
        players.splice(i, 1);
    });

    socket.on('test',function(){
        console.log('test received');
    });
    console.log(socket.request.connection.remoteAddress);
    let sockets = []
    players.forEach((p)=>{
        if(sockets.includes(p.con)){
            socket.disconnect();
            console.log("Bip");
        }
        sockets.push(p.con);
    }) 
});


function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
setInterval(() => {
  players.forEach((p) => {
    p.move();
  });
  io.emit('update', {
    players: players.map((p) => ({
      x: p.x,
      y: p.y ,
      id: p.id,
      tail: p.tail
    })),
    apples: apples.map((a) => ({
      x: a.x,
      y: a.y
    }))
  });
}, 100);