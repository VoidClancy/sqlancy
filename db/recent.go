package db

import (
	"encoding/json"
	"errors"
	"os"
)

type RecentDB struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

const recentFile = "recent-dbs.json"

func GetRecent() ([]RecentDB, error) {
	data, err := os.ReadFile(recentFile)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return []RecentDB{}, nil
		}
		return nil, err
	}

	var recent []RecentDB
	if err := json.Unmarshal(data, &recent); err != nil {
		return nil, err
	}

	return recent, nil
}

func AddToRecent(name, path string) error {
	recent, err := GetRecent()
	if err != nil {
		return err
	}

	filtered := make([]RecentDB, 0, len(recent)+1)
	for _, r := range recent {
		if r.Path != path {
			filtered = append(filtered, r)
		}
	}

	recent = append([]RecentDB{{Name: name, Path: path}}, filtered...)

	data, err := json.Marshal(recent)
	if err != nil {
		return err
	}

	return os.WriteFile(recentFile, data, 0644)
}
