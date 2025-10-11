package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"Krowka/model"
	"Krowka/pkg/redisrepo"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn     *websocket.Conn
	Username string
}

type Message struct {
	Type string     `json:"type"`
	User string     `json:"user,omitempty"`
	Chat model.Chat `json:"chat,omitempty"`
}

var clients = make(map[*Client]bool)
var broadcast = make(chan *model.Chat)

// We'll need to define an Upgrader
// this will require a Read and Write buffer size

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	// check the origin of of our connection
	// this will allow me to make requests from React
	// server to here.
	// For now, I'll do nothing and just allow any connection
	CheckOrigin: func(r *http.Request) bool { return true },
}

//define a reciver which will listen for new messages
// being sent to my Websocket
// endpoint

func receiver(client *Client) {
	for {
		// read message
		// readMessage returns messageType, message, err
		// messageType: 1-> Text Message, 2 -> Binary Message

		_, p, err := client.Conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		m := &Message{}

		err = json.Unmarshal(p, m)
		if err != nil {
			log.Println("Error while unmarshaling chat", err)
			continue
		}

		fmt.Println("host", client.Conn.RemoteAddr())
		if m.Type == "bootup" {
			// do mapping on bootup
			client.Username = m.User
			fmt.Println("Client successfully mapped", &client, client, client.Username)
		} else {
			fmt.Println("received message", m.Type, m.Chat)
			c := m.Chat
			c.Timestamp = time.Now().Unix()

			//save in redis
			id, err := redisrepo.CreateChat(&c)
			if err != nil {
				log.Println("error while savinf chat in redis", err)
				return
			}
			c.ID = id
			broadcast <- &c
		}
	}
}

func broadcaster() {
	for {
		message := <-broadcast
		//send to every client that is currently connected
		fmt.Println("new message", message)

		for client := range clients {
			//send message only to invloved users
			fmt.Println("username:", client.Username,
				"from:", message.From,
				"to:", message.To)

			if client.Username == message.From || client.Username == message.To {
				err := client.Conn.WriteJSON(message)
				if err != nil {
					log.Printf("Websocket error: %s", err)
					client.Conn.Close()
					delete(clients, client)
				}
			}
		}
	}
}

// define the websocket endpoint
func serveWS(w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.Host, r.URL.Query())

	//upgrade this connection to a Websocket
	//connection
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}

	client := &Client{Conn: ws}
	//register client
	clients[client] = true
	fmt.Println("Clients", len(clients), clients, ws.RemoteAddr())

	//listen indefinitely for new messages coming
	// through on our websocket connection
	receiver(client)

	fmt.Println("exciting", ws.RemoteAddr().String())
	delete(clients, client)
}

func setupRoutes() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Simple Server")
	})
	//map our `/ws` endpoint to the `serveWS` function
	http.HandleFunc("/ws", serveWS)
}

func StartWebSocketServer() {
	redisClient := redisrepo.InitialiseRedis()
	defer redisClient.Close()

	go broadcaster()
	setupRoutes()
	http.ListenAndServe(":8081", nil)
}
