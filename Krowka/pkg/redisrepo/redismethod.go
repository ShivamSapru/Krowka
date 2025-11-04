package redisrepo

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"Krowka/model"

	"github.com/go-redis/redis/v8"
	"golang.org/x/crypto/bcrypt"
)

func RegisterNewUser(username, password string) error {
	// redis-cli
	// SYNTAX: SET key value
	// SET username password
	// Hash the password before storing
	hashed, errHash := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if errHash != nil {
		log.Println("error while hashing password", errHash)
		return errHash
	}
	// register new username:password key-value pair (hashed)
	err := redisClient.Set(context.Background(), username, string(hashed), 0).Err()
	if err != nil {
		log.Println("error while adding new user", err)
		return err
	}

	// redis-cli
	// SYNTAX: SADD key value
	// SADD users username
	err = redisClient.SAdd(context.Background(), userSetKey(), username).Err()
	if err != nil {
		log.Println("error while adding user in set", err)
		// redis-cli
		// SYNTAX: DEL key
		// DEL username
		// drop the registered user
		redisClient.Del(context.Background(), username)

		return err
	}

	return nil
}

func IsUserExist(username string) bool {
	// redis-cli
	// SYNTAX: SISMEMBER key value
	// SISMEMBER users username
	return redisClient.SIsMember(context.Background(), userSetKey(), username).Val()
}

func IsUserAuthentic(username, password string) error {
	// redis-cli
	// SYNTAX: GET key
	// GET username
	p := redisClient.Get(context.Background(), username).Val()

	if p == "" {
		return fmt.Errorf("invalid username or password")
	}

	// If stored value looks like bcrypt hash, compare with bcrypt
	if strings.HasPrefix(p, "$2a$") || strings.HasPrefix(p, "$2b$") || strings.HasPrefix(p, "$2y$") {
		if err := bcrypt.CompareHashAndPassword([]byte(p), []byte(password)); err != nil {
			return fmt.Errorf("invalid username or password")
		}
		return nil
	}

	// Backward-compat: plaintext stored. If matches, migrate to bcrypt.
	if strings.EqualFold(p, password) {
		if hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost); err == nil {
			_ = redisClient.Set(context.Background(), username, string(hashed), 0).Err()
		}
		return nil
	}

	return fmt.Errorf("invalid username or password")
}

// UpdateContactList add contact to username's contact list
// if not present or update its timestamp as last contacted
func UpdateContactList(username, contact string) error {
	zs := &redis.Z{Score: float64(time.Now().Unix()), Member: contact}

	// redis-cli SCORE is always float or int
	// SYNTAX: ZADD key SCORE MEMBER
	// ZADD contacts:username 1661360942123 contact
	err := redisClient.ZAdd(context.Background(),
		contactListZKey(username),
		zs,
	).Err()

	if err != nil {
		log.Println("error while updating contact list. username: ",
			username, "contact:", contact, err)
		return err
	}

	return nil
}

func CreateChat(c *model.Chat) (string, error) {
	chatKey := chatKey()
	fmt.Println("chat key", chatKey)

	by, _ := json.Marshal(c)

	// redis-cli
	// SYNTAX: JSON.SET key $ json_in_string
	// JSON.SET chat#1661360942123 $ '{"from": "sun", "to":"earth","message":"good morning!"}'
	res, err := redisClient.Do(
		context.Background(),
		"JSON.SET",
		chatKey,
		"$",
		string(by),
	).Result()

	if err != nil {
		log.Println("error while setting chat json", err)
		return "", err
	}

	log.Println("chat successfully set", res)

	// add contacts to both user's contact list
	err = UpdateContactList(c.From, c.To)
	if err != nil {
		log.Println("error while updating contact list of", c.From)
	}

	err = UpdateContactList(c.To, c.From)
	if err != nil {
		log.Println("error while updating contact list of", c.To)
	}

	return chatKey, nil
}

func CreateFetchChatBetweenIndex() {
	res, err := redisClient.Do(context.Background(),
		"FT.CREATE",
		chatIndex(),
		"ON", "JSON",
		"PREFIX", "1", "chat#",
		"SCHEMA", "$.from", "AS", "from", "TAG",
		"$.to", "AS", "to", "TAG",
		"$.timestamp", "AS", "timestamp", "NUMERIC", "SORTABLE",
	).Result()

	fmt.Println(res, err)
}

func FetchChatBetween(username1, username2, fromTS, toTS string) ([]model.Chat, error) {
	// redis-cli
	// SYNTAX: FT.SEARCH index query
	// FT.SEARCH idx#chats '@from:{user2|user1} @to:{user1|user2} @timestamp:[0 +inf] SORTBY timestamp DESC'
	query := fmt.Sprintf("@from:{%s|%s} @to:{%s|%s} @timestamp:[%s %s]",
		username1, username2, username1, username2, fromTS, toTS)

	res, err := redisClient.Do(context.Background(),
		"FT.SEARCH",
		chatIndex(),
		query,
		"SORTBY", "timestamp", "DESC",
	).Result()

	if err != nil {
		return nil, err
	}

	// deserialise redis data to map
	data := Deserialise(res)

	// deserialise data map to chat
	chats := DeserialiseChat(data)
	return chats, nil
}

// FetchContactList of the user. It includes all the messages sent to and received by contact
// It will return a sorted list by last activity with a contact
func FetchContactList(username string) ([]model.ContactList, error) {
	zRangeArg := redis.ZRangeArgs{
		Key:   contactListZKey(username),
		Start: 0,
		Stop:  -1,
		Rev:   true,
	}

	// redis-cli
	// SYNTAX: ZRANGE key from_index to_index REV WITHSCORES
	// ZRANGE contacts:username 0 -1 REV WITHSCORES
	res, err := redisClient.ZRangeArgsWithScores(context.Background(), zRangeArg).Result()

	if err != nil {
		log.Println("error while fetching contact list. username: ",
			username, err)
		return nil, err
	}

	contactList := DeserialiseContactList(res)

	return contactList, nil
}

// Profile management

func GetProfile(username string) (*model.Profile, error) {
	// Try to fetch JSON profile; if missing, return defaults
	res, err := redisClient.Do(context.Background(),
		"JSON.GET",
		profileKey(username),
		"$",
	).Result()

	if err != nil || res == nil {
		// Return default profile
		p := &model.Profile{Username: username}
		return p, nil
	}

	// Deserialise JSON.GET result which returns JSON string
	var arr []model.Profile
	by := []byte(res.(string))
	if err := json.Unmarshal(by, &arr); err != nil || len(arr) == 0 {
		p := &model.Profile{Username: username}
		return p, nil
	}
	p := arr[0]
	return &p, nil
}

func SaveProfile(p *model.Profile) error {
	by, _ := json.Marshal(p)
	_, err := redisClient.Do(context.Background(),
		"JSON.SET",
		profileKey(p.Username),
		"$",
		string(by),
	).Result()
	return err
}

func SetTwoFA(username string, enabled bool) error {
	// Update only the twoFA field; if doc doesn't exist, create minimal
	p, _ := GetProfile(username)
	p.TwoFA = enabled
	return SaveProfile(p)
}

func ChangePassword(username, oldPassword, newPassword string) error {
	// Verify old password
	if err := IsUserAuthentic(username, oldPassword); err != nil {
		return err
	}
	// Hash and set new password
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return redisClient.Set(context.Background(), username, string(hashed), 0).Err()
}
