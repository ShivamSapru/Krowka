package httpserver

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"Krowka/model"
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

type profileReq struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	AvatarURL   string `json:"avatarUrl"`
}

type passwordChangeReq struct {
	Username    string `json:"username"`
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

type twoFAReq struct {
	Username string `json:"username"`
	Enabled  bool   `json:"enabled"`
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	u := &userReq{}
	if err := json.NewDecoder(r.Body).Decode(u); err != nil {
		http.Error(w, "error decoidng request object", http.StatusBadRequest)
		return
	}

	res := register(u)
	json.NewEncoder(w).Encode(res)
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	u := &userReq{}
	if err := json.NewDecoder(r.Body).Decode(u); err != nil {
		http.Error(w, "error decoidng request object", http.StatusBadRequest)
		return
	}

	res := login(u)
	json.NewEncoder(w).Encode(res)
}

func verifyContactHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	u := &userReq{}
	if err := json.NewDecoder(r.Body).Decode(u); err != nil {
		http.Error(w, "error decoidng request object", http.StatusBadRequest)
		return
	}

	res := verifyContact(u.Username)
	json.NewEncoder(w).Encode(res)
}

func chatHistoryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// user1 user2
	u1 := UsernameFromContext(r)
	if u1 == "" { // legacy fallback
		u1 = r.URL.Query().Get("u1")
	}
	u2 := r.URL.Query().Get("u2")

	// chat between timerange fromTS toTS
	// where TS is timestamp
	// 0 to positive infinity
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

	u := UsernameFromContext(r)
	if u == "" { // legacy fallback
		u = r.URL.Query().Get("username")
	}

	res := contactList(u)
	json.NewEncoder(w).Encode(res)
}

func getProfileHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	username := UsernameFromContext(r)
	if username == "" { // legacy fallback
		username = r.URL.Query().Get("username")
	}
	res := &response{Status: true}
	if username == "" {
		res.Status = false
		res.Message = "missing username"
		json.NewEncoder(w).Encode(res)
		return
	}
	p, err := redisrepo.GetProfile(username)
	if err != nil {
		res.Status = false
		res.Message = "unable to fetch profile"
		json.NewEncoder(w).Encode(res)
		return
	}
	res.Data = p
	json.NewEncoder(w).Encode(res)
}

func updateProfileHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	pr := &profileReq{}
	if err := json.NewDecoder(r.Body).Decode(pr); err != nil {
		http.Error(w, "error decoding request object", http.StatusBadRequest)
		return
	}
	res := &response{Status: true}
	if uname := UsernameFromContext(r); uname != "" {
		pr.Username = uname
	}
	p := &model.Profile{
		Username:    pr.Username,
		DisplayName: pr.DisplayName,
		Email:       pr.Email,
		Phone:       pr.Phone,
		AvatarURL:   pr.AvatarURL,
	}
	if err := redisrepo.SaveProfile(p); err != nil {
		res.Status = false
		res.Message = "unable to save profile"
	}
	json.NewEncoder(w).Encode(res)
}

func changePasswordHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	pr := &passwordChangeReq{}
	if err := json.NewDecoder(r.Body).Decode(pr); err != nil {
		http.Error(w, "error decoding request object", http.StatusBadRequest)
		return
	}
	res := &response{Status: true}
	if uname := UsernameFromContext(r); uname != "" {
		pr.Username = uname
	}
	if err := redisrepo.ChangePassword(pr.Username, pr.OldPassword, pr.NewPassword); err != nil {
		res.Status = false
		res.Message = err.Error()
	}
	json.NewEncoder(w).Encode(res)
}

func toggle2FAHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	tr := &twoFAReq{}
	if err := json.NewDecoder(r.Body).Decode(tr); err != nil {
		http.Error(w, "error decoding request object", http.StatusBadRequest)
		return
	}
	res := &response{Status: true}
	if uname := UsernameFromContext(r); uname != "" {
		tr.Username = uname
	}
	if err := redisrepo.SetTwoFA(tr.Username, tr.Enabled); err != nil {
		res.Status = false
		res.Message = "unable to update 2FA setting"
	}
	json.NewEncoder(w).Encode(res)
}

func avatarUploadHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	res := &response{Status: true}

	// Parse up to 5MB files
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		http.Error(w, "could not parse form", http.StatusBadRequest)
		return
	}
	username := UsernameFromContext(r)
	if username == "" { // legacy fallback
		username = r.FormValue("username")
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file missing", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Save file under avatars/<username>-<filename>
	fname := fmt.Sprintf("%s-%s", username, header.Filename)
	path := fmt.Sprintf("avatars/%s", fname)
	out, err := os.Create(path)
	if err != nil {
		http.Error(w, "unable to save file", http.StatusInternalServerError)
		return
	}
	defer out.Close()
	if _, err := io.Copy(out, file); err != nil {
		http.Error(w, "unable to write file", http.StatusInternalServerError)
		return
	}

	// Update profile avatar URL
	p, _ := redisrepo.GetProfile(username)
	p.AvatarURL = "/avatars/" + fname
	if err := redisrepo.SaveProfile(p); err != nil {
		res.Status = false
		res.Message = "unable to update avatar url"
		json.NewEncoder(w).Encode(res)
		return
	}
	res.Data = map[string]string{"avatarUrl": p.AvatarURL}
	json.NewEncoder(w).Encode(res)
}

// attachmentUploadHandler handles chat attachment uploads and returns a public URL
func attachmentUploadHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	res := &response{Status: true}

	// Parse up to 20MB files
	if err := r.ParseMultipartForm(20 << 20); err != nil {
		http.Error(w, "could not parse form", http.StatusBadRequest)
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file missing", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Ensure uploads dir exists
	os.MkdirAll("uploads", 0755)

	// Create a unique filename: epoch-filename
	safeName := filepath.Base(header.Filename)
	fname := fmt.Sprintf("%d-%s", time.Now().UnixNano(), safeName)
	path := filepath.Join("uploads", fname)

	out, err := os.Create(path)
	if err != nil {
		http.Error(w, "unable to save file", http.StatusInternalServerError)
		return
	}
	defer out.Close()
	if _, err := io.Copy(out, file); err != nil {
		http.Error(w, "unable to write file", http.StatusInternalServerError)
		return
	}

	// Return the public URL
	url := "/uploads/" + fname
	res.Data = map[string]string{
		"url":  url,
		"name": header.Filename,
		"mime": header.Header.Get("Content-Type"),
	}
	json.NewEncoder(w).Encode(res)
}

func register(u *userReq) *response {
	// check if username in userset
	// return error if exist
	// create new user
	// create response for error
	res := &response{Status: true}

	status := redisrepo.IsUserExist(u.Username)
	if status {
		res.Status = false
		res.Message = "username already taken. try something else."
		return res
	}

	err := redisrepo.RegisterNewUser(u.Username, u.Password)
	if err != nil {
		res.Status = false
		res.Message = "something went wrong while registering the user. please try again after sometime."
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
	// Issue JWT token
	token, errTok := issueToken(u.Username)
	if errTok != nil {
		res.Status = false
		res.Message = "unable to issue token"
		return res
	}
	res.Data = map[string]string{"token": token}
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
	// check if user exists
	if !redisrepo.IsUserExist(username1) || !redisrepo.IsUserExist(username2) {
		res.Message = "incorrect username"
		return res
	}

	chats, err := redisrepo.FetchChatBetween(username1, username2, fromTS, toTS)
	if err != nil {
		log.Println("error in fetch chat between", err)
		res.Message = "unable to fetch chat history. please try again later."
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

	// check if user exists
	if !redisrepo.IsUserExist(username) {
		res.Message = "incorrect username"
		return res
	}

	contactList, err := redisrepo.FetchContactList(username)
	if err != nil {
		log.Println("error in fetch contact list of username: ", username, err)
		res.Message = "unable to fetch contact list. please try again later."
		return res
	}

	res.Status = true
	res.Data = contactList
	res.Total = len(contactList)
	return res
}
