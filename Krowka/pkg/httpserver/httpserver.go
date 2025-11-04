package httpserver

import (
	"fmt"
	"net/http"
	"os"

	"Krowka/pkg/redisrepo"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func StartHTTPServer() {
	// initialise redis
	redisClient := redisrepo.InitialiseRedis()
	defer redisClient.Close()

	// create indexes
	redisrepo.CreateFetchChatBetweenIndex()

	r := mux.NewRouter()
	// ensure avatars directory exists
	os.MkdirAll("avatars", 0755)
	// ensure uploads directory exists
	os.MkdirAll("uploads", 0755)
	r.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Simple Server")
	}).Methods(http.MethodGet)

	r.HandleFunc("/register", registerHandler).Methods(http.MethodPost)
	r.HandleFunc("/login", loginHandler).Methods(http.MethodPost)
	r.Handle("/verify-contact", AuthMiddleware(http.HandlerFunc(verifyContactHandler))).Methods(http.MethodPost)
	r.Handle("/chat-history", AuthMiddleware(http.HandlerFunc(chatHistoryHandler))).Methods(http.MethodGet)
	r.Handle("/contact-list", AuthMiddleware(http.HandlerFunc(contactListHandler))).Methods(http.MethodGet)
	// profile routes
	r.Handle("/profile", AuthMiddleware(http.HandlerFunc(getProfileHandler))).Methods(http.MethodGet)
	r.Handle("/profile", AuthMiddleware(http.HandlerFunc(updateProfileHandler))).Methods(http.MethodPost)
	r.Handle("/password/change", AuthMiddleware(http.HandlerFunc(changePasswordHandler))).Methods(http.MethodPost)
	r.Handle("/2fa/toggle", AuthMiddleware(http.HandlerFunc(toggle2FAHandler))).Methods(http.MethodPost)
	r.Handle("/avatar", AuthMiddleware(http.HandlerFunc(avatarUploadHandler))).Methods(http.MethodPost)
	r.Handle("/chat/attachment", AuthMiddleware(http.HandlerFunc(attachmentUploadHandler))).Methods(http.MethodPost)
	// serve avatars statically
	r.PathPrefix("/avatars/").Handler(http.StripPrefix("/avatars/", http.FileServer(http.Dir("avatars"))))
	// serve uploads statically
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	// CORS with explicit Authorization header support
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001", "*"},
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"},
		AllowCredentials: true,
	})
	handler := c.Handler(r)
	http.ListenAndServe(":8080", handler)
}
