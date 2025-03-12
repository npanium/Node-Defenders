
using System;

// WebSocket
[Serializable]
public class ServerMessage {
    public string type;
}

[Serializable]
public class GameStateData {
    public int totalNodesPlaced;
    public string selectedNodeId;
}

[Serializable]
public class StateUpdateMessage : ServerMessage {
    public GameStateData data;
}

[Serializable]
public class ActionConfirmedMessage : ServerMessage {
    public string action;
    public bool success;
    public int newTotal;
    public string nodeId;
}

[Serializable]
public class NodePlacedMessage : ServerMessage {
    public string nodeType;
    public Position position;
    public NodeStatsData stats;
    public string timestamp;
}

[Serializable]
public class NodeDestroyedMessage : ServerMessage {
    public string nodeType;
    public string nodeId;
    public string timestamp;
}

[Serializable]
public class NodeStatsUpdateMessage : ServerMessage {
    public string nodeId;
    public int level;
    public NodeStatsData stats;
}

[Serializable]
public class NodeHealthUpdateMessage : ServerMessage {
    public string nodeId;
    public int currentHealth;
    public int maxHealth;
    public float healthPercentage;
}

[Serializable]
public class WaveCountdownMessage : ServerMessage {
    public int waveNumber;
    public float countdown;
    public int maxWaves;
    public string timestamp;
}

[Serializable]
public class WaveStartedMessage : ServerMessage {
    public int waveNumber;
    public int enemiesInWave;
    public int maxWaves;
    public string timestamp;
}

[Serializable]
public class EnemyDestroyedMessage : ServerMessage {
    public int currencyEarned;
    public string timestamp;
}


[Serializable]
public class GameStatsMessage : ServerMessage {
    public int currency;
    public int enemiesKilled;
    public string timestamp;
}

[Serializable]
public class GameWonMessage : ServerMessage {
    public string reason;
    public string timestamp;
}

// Plot

[Serializable]
public class NodeSelectedMessage {
    public string type;
    public string nodeId;
}
[Serializable]
public class Position {
    public float x;
    public float y;
    public float z;
}

// Node
[Serializable]
public class NodeStatsData {
    public float damage;
    public float range;
    public float speed;
    public float efficiency;
}

[Serializable]
public class NodeUpgradeMessage {
    public string type;
    public string nodeId;
    public int level;
    public NodeStatsData stats;
}

//  Level manager
[Serializable]
public class CurrencyUpdateMessage {
    public string type;
    public int amount;
    public string operation; // "increase" or "decrease"
    public int balance;
    public string timestamp;
}

[Serializable]
public class GameStateUpdateMessage {
    public string type;
    public int currency;
    public int health;
    public int maxHealth;
    public int enemiesKilled;
    public string timestamp;
}

public class EnemyKilledMessage : ServerMessage {
    public int enemiesKilled;
    public string timestamp;
}