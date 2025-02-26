using System;
using System.Collections.Generic;
using Newtonsoft.Json;

[Serializable]
public class GameState {
    [JsonProperty("currency")]
    public int Currency { get; set; }

    [JsonProperty("score")]
    public int Score { get; set; }

    [JsonProperty("enemiesKilled")]
    public int EnemiesKilled { get; set; }

    [JsonProperty("turretsPlaced")]
    public int TurretsPlaced { get; set; }

    [JsonProperty("liquidityPools")]
    public List<LiquidityPool> LiquidityPools { get; set; }
}

[Serializable]
public class LiquidityPool {
    [JsonProperty("id")]
    public string Id { get; set; }

    [JsonProperty("type")]
    public string Type { get; set; }

    [JsonProperty("amount")]
    public float Amount { get; set; }

    [JsonProperty("returns")]
    public string Returns { get; set; }
}