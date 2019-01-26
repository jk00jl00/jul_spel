
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

let username = getCookie("username");



var Client = {};
Client.socket = io.connect();

var player = {};
var canvas = document.getElementById('game');
var ctx = canvas.getContext("2d");
var screenWidth = canvas.width,
    screenHeight = canvas.height,
    gridWidth = screenWidth/100,
    gridHeight = screenHeight/100,
    mapSize = 0,
    cameraOfSet = {x: 0, y: 0};

document.onkeydown = (ev) =>{
    Client.socket.emit('keyDown', ev.keyCode);
}

Client.socket.on('allplayers',function(data, size){
    player = data;
    mapSize = size;
    Client.socket.emit('username', username);
});
Client.socket.on('update',function(data){
    draw(data);
});

Client.socket.on('usernameTaken', () => {document.cookie = ""; window.location.href = "/";})

function camera(){
    if(cameraOfSet.x < player.x * gridWidth - screenWidth/2) cameraOfSet.x += ((player.x * gridWidth - screenWidth/2) - cameraOfSet.x)/10;
    else if(cameraOfSet.x > player.x * gridWidth - screenWidth/2) cameraOfSet.x -= (cameraOfSet.x - (player.x * gridWidth - screenWidth/2))/10;

    cameraOfSet.x = (cameraOfSet.x > mapSize * gridWidth - screenWidth)? mapSize * gridWidth - screenWidth :(cameraOfSet.x < 0)? 0 : cameraOfSet.x;
    cameraOfSet.x = Math.round(cameraOfSet.x);

    if(cameraOfSet.y < player.y * gridHeight - screenHeight/2) cameraOfSet.y += ((player.y * gridHeight - screenHeight/2) - cameraOfSet.y)/10;
    else if(cameraOfSet.y > player.y * gridHeight - screenHeight/2)cameraOfSet.y -= (cameraOfSet.y - (player.y * gridHeight - screenHeight/2))/10;
        
    cameraOfSet.y = (cameraOfSet.y > mapSize * gridHeight - screenWidth)?  mapSize * gridHeight - screenWidth : (cameraOfSet.y < 0)? 0 : cameraOfSet.y;
    cameraOfSet.y = Math.round(cameraOfSet.y);


}
    

function draw(data){

    data.players.forEach((p) => {
        if(p.id === player.id){
            player = p;
        }
    });

    camera();
    ctx.clearRect(0,0, screenWidth, screenHeight);
    ctx.font = "bold 15px Arial"; 
    ctx.fillStyle = 'black';
    ctx.fillText("Length: " + (player.tail.length + 1), screenWidth - 75, screenHeight - 15);

    let lenghts = data.players.map((p) =>({
        id: p.id,
        len: p.tail.length + 1,
        username: p.username
    }));

    lenghts.sort((a, b) => b.len - a.len);
    for(let i = 0; i < 5 && lenghts[i]; i++){
        
            ctx.fillText(lenghts[i].username+ ": " + lenghts[i].len, 15, 30 + 15* i);

    }

    data.players.forEach((p) => {
        if(p.id === player.id)
            ctx.fillStyle = 'black';
        else
            ctx.fillStyle = 'blue';
        if((p.x  * gridWidth - cameraOfSet.x >= 0 && p.x * gridWidth - cameraOfSet.x <= screenWidth) &&
           (p.y * gridHeight - cameraOfSet.y >= 0 && p.y * gridHeight - cameraOfSet.y <= screenHeight))
            ctx.fillRect(p.x * gridWidth - cameraOfSet.x, p.y * gridHeight - cameraOfSet.y, gridWidth, gridHeight);
        p.tail.forEach((t) =>{
            if((t.x  * gridWidth - cameraOfSet.x >= 0 && t.x * gridWidth - cameraOfSet.x <= screenWidth) &&
               (t.y * gridHeight - cameraOfSet.y >= 0 && t.y * gridHeight - cameraOfSet.y <= screenHeight))
                ctx.fillRect(t.x * gridWidth - cameraOfSet.x, t.y * gridHeight - cameraOfSet.y, gridWidth, gridHeight);
        });
    });

    data.apples.forEach((a) =>{
        if((a.x  * gridWidth - cameraOfSet.x >= 0 && a.x * gridWidth - cameraOfSet.x <= screenWidth) &&
           (a.y * gridHeight - cameraOfSet.y >= 0 && a.y * gridHeight - cameraOfSet.y <= screenHeight)){
            ctx.fillStyle = a.colour;
            ctx.fillRect(a.x  * gridWidth - cameraOfSet.x, a.y * gridHeight - cameraOfSet.y, gridWidth, gridHeight);
        }
    })
}

