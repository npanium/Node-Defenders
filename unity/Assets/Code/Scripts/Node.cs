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

    private float bpsBase;
    private float targetingRangeBase;

    private Transform target;
    private float timeUntilFire;

    private int level = 1;

    // Store the node ID assigned by the server
    [HideInInspector]
    public string nodeId;

    // Reference to the plot this node is placed on
    [HideInInspector]
    public Plot parentPlot;

    private void Start() {
        bpsBase = bps;
        targetingRangeBase = targetingRange;

        upgradeButton.onClick.AddListener(Upgrade);

        // Try to get parent plot if not set
        if (parentPlot == null) {
            parentPlot = GetComponentInParent<Plot>();

            // If we have a parent plot, get any existing nodeId
            if (parentPlot != null && !string.IsNullOrEmpty(parentPlot.nodeId)) {
                nodeId = parentPlot.nodeId;
            }
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
        bulletScript.SetTarget(target);
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

    private void
        RotateTowardsTarget() {
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

        CloseUpgradeUI();
        Debug.Log("New BPS: " + bps);
        Debug.Log("New Targeting range: " + targetingRange);
        Debug.Log("New Cost: " + CalculateCost());

        // Notify about the upgrade if we have a nodeId
        if (!string.IsNullOrEmpty(nodeId) && WsClient.Instance != null) {
            // Create a notification about the node upgrade
            NodeUpgradeMessage msg = new NodeUpgradeMessage {
                type = "node_upgraded",
                nodeId = nodeId,
                level = level,
                stats = new NodeStatsData {
                    damage = level, // For demonstration, using level as damage
                    range = targetingRange,
                    speed = bps,
                    efficiency = level // For demonstration
                }
            };

            string json = JsonUtility.ToJson(msg);
            WsClient.Instance.SendWebSocketMessage(json);
        }
    }

    // Method to select this node (trigger selection in parent plot)
    public void Select() {
        if (parentPlot != null) {
            parentPlot.SelectNode();
        }
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

    private void OnDrawGizmosSelected() {
        Handles.color = Color.cyan;
        Handles.DrawWireDisc(transform.position, transform.forward, targetingRange);
    }
}

[System.Serializable]
public class NodeStatsData {
    public float damage;
    public float range;
    public float speed;
    public float efficiency;
}

[System.Serializable]
public class NodeUpgradeMessage {
    public string type;
    public string nodeId;
    public int level;
    public NodeStatsData stats;
}
