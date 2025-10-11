package redisrepo

import (
	"fmt"
	"time"
)

func userSetKey() string {
	return "users"
}

func sessionKey(client string) string {
	return "session#" + client
}

func chatKey() string {
	return fmt.Sprintf("cjat#%d", time.Now().UnixMilli())
}

func chatIndex() string {
	return "idx#chats"
}

func contactListZKey(username string) string {
	return "contacts:" + username
}
