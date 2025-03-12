using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;
using System;
using UnityEngine.UI;

public class Node : MonoBehaviour {

    [Header("References")]
    [SerializeField] private Transform nodeRotationPoint;
    [SerializeField] private LayerMask enemyMask;
    [SerializeField] private GameObject bulletPrefab;
    [SerializeField] private Transform firingPoint;
    [SerializeField] private GameObject upgradeUI;
    [SerializeField] private Button upgradeButton;

    [Header("Attribute")]
    [SerializeField] private float targetingRange = 0.75f;
    [SerializeField] private float rotationSpeed = 5f;
    [SerializeField] private float bps = 1f; //Bullet Per Second
    [SerializeField] private int baseUpgradeCost = 100;
    [SerializeField] private float bulletSpeed = 5f;
    [SerializeField] private int bulletDamage = 1;

    private float bpsBase;
    private float targetingRangeBase;
    private float bulletSpeedBase;
    private int bulletDamageBase;

    private Transform target;
    private float timeUntilFire;

    private int level = 1;

    // Store the node ID assigned by the server
    [HideInInspector]
    public string nodeId;

    // Reference to the plot this node is placed on
    [HideInInspector]
    public Plot parentPlot;

    // Event for when stats are updated
    public delegate void StatsUpdatedHandler(string nodeId, NodeStatsData stats);
    public static event StatsUpdatedHandler OnStatsUpdated;

    private void Start() {
        bpsBase = bps;
        targetingRangeBase = targetingRange;
        bulletSpeedBase = bulletSpeed;
        bulletDamageBase = bulletDamage;

        upgradeButton.onClick.AddListener(Upgrade);

        // Try to get parent plot if not set
        if (parentPlot == null) {
            parentPlot = GetComponentInParent<Plot>();

            // If we have a parent plot, get any existing nodeId
            if (parentPlot != null && !string.IsNullOrEmpty(parentPlot.nodeId)) {
                nodeId = parentPlot.nodeId;
            }
        }

        // Register for WebSocket updates
        WsClient client = WsClient.Instance;
        if (client != null) {
            client.OnNodeStatsUpdate += HandleStatsUpdate;
        }
    }

    private void OnDestroy() {
        // Unregister from WebSocket updates
        WsClient client = WsClient.Instance;
        if (client != null) {
            client.OnNodeStatsUpdate -= HandleStatsUpdate;
        }
    }

    // Handle incoming stats updates from the backend
    private void HandleStatsUpdate(string updatedNodeId, NodeStatsData updatedStats) {
        // Only update if this is our node
        if (updatedNodeId == nodeId) {
            Debug.Log($"Updating stats for node {nodeId}");

            // Update node stats from the received data
            SetDamage(updatedStats.damage);
            SetTargetingRange(updatedStats.range);
            SetBPS(updatedStats.speed);
            SetBulletSpeed(updatedStats.efficiency);

            // Recalculate level based on the new stats (optional)
            RecalculateLevel();
        }
    }

    private void Update() {
        if (target == null) {
            FindTarget();
            return;
        }

        RotateTowardsTarget();

        if (!CheckTargetIsInRange()) {
            target = null;
        } else {
            timeUntilFire += Time.deltaTime;

            if (timeUntilFire >= 1f / bps) {
                Shoot();
                timeUntilFire = 0f;
            }
        }
    }

    private void Shoot() {
        GameObject bulletObj = Instantiate(bulletPrefab, firingPoint.position, Quaternion.identity);
        Bullet bulletScript = bulletObj.GetComponent<Bullet>();

        // Set bullet properties based on node stats
        bulletScript.SetTarget(target);
        bulletScript.SetDamage(bulletDamage);
        bulletScript.SetSpeed(bulletSpeed);
    }

    private bool CheckTargetIsInRange() {
        return Vector2.Distance(target.position, transform.position) <= targetingRange;
    }

    private void FindTarget() {
        RaycastHit2D[] hits = Physics2D.CircleCastAll(transform.position, targetingRange, (Vector2)transform.position, 0f, enemyMask);

        if (hits.Length > 0) {
            target = hits[0].transform;
        }
    }

    private void RotateTowardsTarget() {
        float angle = Mathf.Atan2(target.position.y - transform.position.y, target.position.x - transform.position.x) * Mathf.Rad2Deg - 180f;

        Quaternion targetRotation = Quaternion.Euler(new Vector3(0f, 0f, angle));
        nodeRotationPoint.rotation = Quaternion.RotateTowards(nodeRotationPoint.rotation, targetRotation, rotationSpeed * Time.deltaTime);
    }

    public void OpenUpgradeUI() {
        upgradeUI.SetActive(true);
    }

    public void CloseUpgradeUI() {
        upgradeUI.SetActive(false);
        UIManager.main.SetHoveringState(false);
    }

    public void Upgrade() {
        if (CalculateCost() > LevelManager.main.currency) return;

        LevelManager.main.SpendCurrency(CalculateCost());

        level++;

        bps = CalculateBPS();
        targetingRange = CalculateRange();
        bulletDamage = CalculateDamage();
        bulletSpeed = CalculateBulletSpeed();

        CloseUpgradeUI();
        Debug.Log("New BPS: " + bps);
        Debug.Log("New Targeting range: " + targetingRange);
        Debug.Log("New Damage: " + bulletDamage);
        Debug.Log("New Bullet Speed: " + bulletSpeed);
        Debug.Log("New Cost: " + CalculateCost());

        // Notify about the upgrade if we have a nodeId
        SendStatsUpdateToServer();
    }

    // Method to send stats to server
    public void SendStatsUpdateToServer() {
        if (!string.IsNullOrEmpty(nodeId) && WsClient.Instance != null) {
            // Create a notification about the stats update
            NodeStatsUpdateMessage msg = new NodeStatsUpdateMessage {
                type = "node_stats_update",
                nodeId = nodeId,
                level = level,
                stats = new NodeStatsData {
                    damage = bulletDamage,
                    range = targetingRange,
                    speed = bps,
                    efficiency = bulletSpeed
                }
            };

            string json = JsonUtility.ToJson(msg);
            WsClient.Instance.SendWebSocketMessage(json);

            // Notify local listeners
            if (OnStatsUpdated != null) {
                OnStatsUpdated(nodeId, msg.stats);
            }
        }
    }

    // Method to select this node (trigger selection in parent plot)
    public void Select() {
        if (parentPlot != null) {
            parentPlot.SelectNode();
        }
    }

    // Recalculate level based on stats (optional)
    private void RecalculateLevel() {
        // This is a simplistic approach - you might want a more complex formula
        float bpsRatio = bps / bpsBase;
        float rangeRatio = targetingRange / targetingRangeBase;
        float damageRatio = bulletDamage / bulletDamageBase;

        // Average improvement across stats
        float averageImprovement = (bpsRatio + rangeRatio + damageRatio) / 3;

        // Calculate level based on average improvement
        level = Mathf.Max(1, Mathf.RoundToInt(averageImprovement * 1.5f));
    }

    // Getters and setters for node stats

    public float GetTargetingRange() {
        return targetingRange;
    }

    public void SetTargetingRange(float value) {
        targetingRange = Mathf.Max(0.1f, value);
    }

    public float GetBPS() {
        return bps;
    }

    public void SetBPS(float value) {
        bps = Mathf.Max(0.1f, value);
    }

    public int GetDamage() {
        return bulletDamage;
    }

    public void SetDamage(float value) {
        bulletDamage = Mathf.Max(1, Mathf.RoundToInt(value));
    }

    public float GetBulletSpeed() {
        return bulletSpeed;
    }

    public void SetBulletSpeed(float value) {
        bulletSpeed = Mathf.Max(1f, value);
    }

    private int CalculateCost() {
        return Mathf.RoundToInt(baseUpgradeCost * Mathf.Pow(level, 0.8f));
    }

    private float CalculateBPS() {
        return bpsBase * Mathf.Pow(level, 0.6f);
    }

    private float CalculateRange() {
        return targetingRangeBase * Mathf.Pow(level, 0.4f);
    }

    private int CalculateDamage() {
        return Mathf.RoundToInt(bulletDamageBase * Mathf.Pow(level, 0.7f));
    }

    private float CalculateBulletSpeed() {
        return bulletSpeedBase * Mathf.Pow(level, 0.3f);
    }

#if UNITY_EDITOR
    private void OnDrawGizmosSelected() {
        Handles.color = Color.cyan;
        Handles.DrawWireDisc(transform.position, transform.forward, targetingRange);
    }
#endif
}

