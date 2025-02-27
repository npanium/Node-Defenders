using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json;

[System.Serializable]
public class GameState {
    [JsonProperty("currency")]
    public int Currency { get; set; }

    // Add other game state properties as needed
    [JsonProperty("health")]
    public int Health { get; set; }

    [JsonProperty("wave")]
    public int Wave { get; set; }

    [JsonProperty("gameId")]
    public string GameId { get; set; }

    [JsonProperty("turrets")]
    public List<TurretInfo> Turrets { get; set; }

    [JsonProperty("lastUpdateTime")]
    public long LastUpdateTime { get; set; }

    // Constructor
    public GameState() {
        Turrets = new List<TurretInfo>();
    }

    // Debug helper
    public override string ToString() {
        return $"GameState: Currency={Currency}, Health={Health}, Wave={Wave}, Turrets={Turrets?.Count ?? 0}";
    }
}

[System.Serializable]
public class TurretInfo {
    [JsonProperty("type")]
    public string Type { get; set; }

    [JsonProperty("position")]
    public Vector3Info Position { get; set; }

    [JsonProperty("level")]
    public int Level { get; set; }

    [JsonProperty("cost")]
    public int Cost { get; set; }
}

[System.Serializable]
public class Vector3Info {
    [JsonProperty("x")]
    public float X { get; set; }

    [JsonProperty("y")]
    public float Y { get; set; }

    [JsonProperty("z")]
    public float Z { get; set; }

    // Conversion to Unity Vector3
    public Vector3 ToVector3() {
        return new Vector3(X, Y, Z);
    }

    // Conversion from Unity Vector3
    public static Vector3Info FromVector3(Vector3 vector) {
        return new Vector3Info {
            X = vector.x,
            Y = vector.y,
            Z = vector.z
        };
    }
}