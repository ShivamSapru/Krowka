package main

import (
	"flag"
	"fmt"
	"log"

	"Krowka/pkg/httpserver"
	"Krowka/pkg/ws"

	"github.com/joho/godotenv"
)

func init() {
	// Load the environment file .env
	err := godotenv.Load()
	if err != nil {
		// Non-fatal: continue if .env is missing in dev environments
		log.Println(".env not found or unable to load; continuing with environment variables only")
	}
}

func main() {
	server := flag.String("server", "", "http,websocket")
	flag.Parse()

	if *server == "http" {
		fmt.Println("http server is starting on :8080")
		httpserver.StartHTTPServer()
	} else if *server == "websocket" {
		fmt.Println("websocket server is starting on :8081")
		ws.StartWebsocketServer()
	} else {
		fmt.Println("invalid server. Available server: http or websocket")
	}
}
