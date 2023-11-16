function objMap(obj, func) {
    return Object.entries(obj).map(([k, v]) => func(k,v));
}
var idx = 0;
function generateUID() {
    // I generate the UID from two parts here 
    // to ensure the random number provide enough bits.
    // var firstPart = (Math.random() * 46656) | 0;
    // var secondPart = (Math.random() * 46656) | 0;
    // firstPart = ("000" + firstPart.toString(36)).slice(-3);
    // secondPart = ("000" + secondPart.toString(36)).slice(-3);
    // return firstPart + secondPart;
    idx = idx +1;
    return idx + "";
}

function route(io) {
    let rooms = {};
    // setInterval(() => {
    //     console.info(rooms);
    // }, 2000);
    
    function getSocketId(user){
        const socketid =  rooms[user.room]?.users[user.uid]?.socketid;
        if(socketid)
            return socketid
        else
            console.info("socket id error",user);
    }

    io.on("connection", socket => {
        socket.on("join", user => {
            if(!rooms[user.room]){
                rooms[user.room] = {
                    roomId : user.room,
                    users : {}
                };
            }       
            user.uid = generateUID();     
            socket.emit( "joinResponse",{
                uid : user.uid,
                users : objMap( rooms[user.room].users, (k,v)=>v.user )
            });
            rooms[user.room].users[user.uid] = {
                user : user,
                socketid : socket.id,
            };
        });
        socket.on("offer", data => {
            if(getSocketId(data.to))
                io.to(getSocketId(data.to)).emit("offer",{
                    from : data.from,
                    to : data.to,
                    offer : data.offer,
                });
        });
        socket.on("answer", data => {
            if(getSocketId(data.to))
                io.to(getSocketId(data.to)).emit("answer",{
                    from : data.from,
                    to : data.to,
                    answer : data.answer,
                });
        });
        socket.on("candidate", data => {
            if(getSocketId(data.to))
            io.to(getSocketId(data.to)).emit("candidate",{
                from : data.from,
                to : data.to,
                candidate : data.candidate,
            });
        });
        
        socket.on("disconnect", () => {            
            Object.entries(rooms).forEach(([k,v])=>{
                rooms[k].users = Object.fromEntries( Object.entries(rooms[k].users).filter(([uid,u])=>{
                    return u.socketid != socket.id;
                }));
                if(Object.keys(rooms[k].users).length == 0){
                    delete rooms[k];
                }
            });
            console.info(rooms);
        });

    });
}


module.exports = route;