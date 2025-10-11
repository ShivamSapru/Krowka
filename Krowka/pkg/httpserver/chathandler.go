package httpserver

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"Krowka/pkg/redisrepo"
)

type userReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Client   string `json:"client"`
}

type response struct {
	Status  bool        `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Total   int         `json:"total,omitempty"`
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	u := &userReq{}
	if err := json.NewDecoder(r.Body).Decode(u); err != nil {
		http.Error(w, "error decoding request object", http.StatusBadRequest)
		return
	}

	res := register(u)
	json.NewEncoder(w).Encode(res)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	u := &userReq{}
	if err := json.NewDecoder(r.Body).Decode(u); err != nil {
		http.Error(w, "error decoding request object", http.StatusBadRequest)
		return
	}

	res := login(u)
	json.NewEncoder(w).Encode(res)
}

func verifyContactHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-type", "application/json")

	u := &userReq{}
	if err := json.NewDecoder(r.Body).Decode(u); err != nil {
		http.Error(w, "Error decoding the request object", http.StatusBadRequest)
		return
	}

	res := verifyContact(u.Username)
	json.NewEncoder(w).Encode(res)
}

func chatHistoryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	//user1 user2
	u1 := r.URL.Query().Get("u1")
	u2 := r.URL.Query().Get("u2")

	//chat between timerange fromTS toTS
	// where TS is the timestamp
	// 0 to postive infinity

	fromTS, toTS := "0", "+inf"

	if r.URL.Query().Get("from-ts") != "" && r.URL.Query().Get("to-ts") != "" {
		fromTS = r.URL.Query().Get("from-ts")
		toTS = r.URL.Query().Get("to-ts")
	}

	res := chatHistory(u1, u2, fromTS, toTS)
	json.NewEncoder(w).Encode(res)
}

func contactListHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	u := r.URL.Query().Get("username")

	res := contactList(u)
	json.NewEncoder(w).Encode(res)
}

func register(u *userReq) *response {
	//check if username is present
	//return error if exist
	//create new user
	// create response for error

	res := &response{Status: true}

	status := redisrepo.IsUserExist(u.Username)
	if status {
		res.Status = false
		res.Message = "Username already taken. Try something else."
		return res
	}

	err := redisrepo.RegisterNewUser(u.Username, u.Password)
	if err != nil {
		res.Status = false
		res.Message = "Something went wrong while registering the user. Please try again after sometime."
		return res
	}

	return res
}

func login(u *userReq) *response {
	// if invalid username and password return error
	// if valid user create new session
	res := &response{Status: true}

	err := redisrepo.IsUserAuthentic(u.Username, u.Password)
	if err != nil {
		res.Status = false
		res.Message = err.Error()
		return res
	}

	return res
}

func verifyContact(username string) *response {
	// if invalid username and password return error
	// if valid user create new session
	res := &response{Status: true}

	status := redisrepo.IsUserExist(username)
	if !status {
		res.Status = false
		res.Message = "invalid username"
	}

	return res
}

func chatHistory(username1, username2, fromTS, toTS string) *response {
	// if invalid usernames return error
	// if valid users fetch chats
	res := &response{}

	fmt.Println(username1, username2)
	//check if user exists
	if !redisrepo.IsUserExist(username1) || !redisrepo.IsUserExist(username2) {
		res.Message = "incorrect username"
		return res
	}

	chats, err := redisrepo.FetchChatBetween(username1, username2, fromTS, toTS)
	if err != nil {
		log.Println("Error in fetch chat between", err)
		res.Message = "unable to fetch chat history. Please try again later."
		return res
	}

	res.Status = true
	res.Data = chats
	res.Total = len(chats)
	return res
}

func contactList(username string) *response {
	// if invalid username return error
	// if valid users fetch chats
	res := &response{}

	//checking if the user exists
	if !redisrepo.IsUserExist(username) {
		res.Message = "incorrect username"
		return res
	}

	contactList, err := redisrepo.FetchContactList(username)
	if err != nil {
		log.Println("error in fetch contact list of username:", username, err)
		res.Message = "Unable to fetch list. Please try again later"
		return res
	}

	res.Status = true
	res.Data = contactList
	res.Total = len(contactList)
	return res
}
