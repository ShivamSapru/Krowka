package model

type Profile struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	AvatarURL   string `json:"avatarUrl"`
	TwoFA       bool   `json:"twoFA"`
}
