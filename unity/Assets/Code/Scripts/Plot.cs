using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Plot : MonoBehaviour {
    [Header("References")]
    [SerializeField] private SpriteRenderer sr;
    [SerializeField] private Color hoverColor;
    [SerializeField] private Color selectedColor;
    [SerializeField] private GameObject placeNodeUI;

    private GameObject nodeObj;
    public Node node;
    private Color startColor;

    // Store the node ID received from the server
    [HideInInspector]
    public string nodeId;

    [HideInInspector]
    public bool isSelected = false;

    // Flag to prevent sending multiple selection messages
    private bool selectionMessageSent = false;

    private WsClient wsClient;
    private Menu menuController;


    private void Start() {
        startColor = sr.color;

        // Find the WebSocket client in the scene
        wsClient = WsClient.Instance;
        if (wsClient == null) {
            wsClient = FindObjectOfType<WsClient>();
        }

        if (placeNodeUI == null) {
            Debug.LogError("PlaceNodeUI reference is missing on Plot: " + gameObject.name);
        }
        menuController = FindObjectOfType<Menu>();
        if (menuController == null) {
            Debug.LogWarning("Plot: Menu controller not found in scene");
        }
    }

    private void OnMouseEnter() {
        if (nodeObj == null) {
            sr.color = hoverColor;
        } else if (!isSelected) {
            // If there's a node and it's not selected, show hover color
            sr.color = hoverColor;
        }
    }

    private void OnMouseExit() {
        if (isSelected) {
            sr.color = selectedColor;
        } else {
            sr.color = startColor;
        }
    }

    private void OnMouseDown() {
        if (UIManager.main.IsHoveringUI()) return;

        Debug.Log("OnMouseDown");
        if (nodeObj != null) {
            // If we have a node, select it
            SelectNode(true); // Pass true to indicate this is a user action
            return;
        }

        // If no node, open place node UI
        OpenPlaceNodeUI();
    }

    // Modified to take a parameter that indicates if this is a user-initiated selection
    public void SelectNode(bool sendMessage = false) {
        // If we're already selected and not forcing a message, do nothing
        if (isSelected && !sendMessage) return;

        Debug.Log("Selecting node: " + nodeId);

        // If we have a valid node ID and need to send a message to the server
        if (!string.IsNullOrEmpty(nodeId) && wsClient != null && sendMessage && !selectionMessageSent) {
            // Create a selection message
            NodeSelectedMessage msg = new NodeSelectedMessage {
                type = "node_selected",
                nodeId = nodeId
            };

            string json = JsonUtility.ToJson(msg);
            wsClient.SendWebSocketMessage(json);

            // Set flag to prevent repeated messages
            selectionMessageSent = true;

            // Reset the flag after a short delay
            StartCoroutine(ResetSelectionFlag());
        }

        // Update visual state
        sr.color = selectedColor;
        isSelected = true;

        // Notify the menu controller if available
        if (menuController != null) {
            menuController.SetSelectedNode(this);
        }
    }

    // Coroutine to reset the selection message flag after a short delay
    private IEnumerator ResetSelectionFlag() {
        yield return new WaitForSeconds(0.5f);
        selectionMessageSent = false;
    }

    // Method to deselect this node
    public void DeselectNode() {
        sr.color = startColor;
        isSelected = false;
        selectionMessageSent = false;
    }

    public void OpenPlaceNodeUI() {
        Debug.Log("OpenPlaceNodeUI");
        // To avoid conflicts with the UIClickOutsideHandler script
        StartCoroutine(OpenUINextFrame());
    }

    private IEnumerator OpenUINextFrame() {
        // Wait for the end of the current frame
        yield return null;

        Debug.Log("OpenPlaceNodeUI - Delayed execution");

        placeNodeUI.SetActive(true);
        UIManager.main.SetHoveringState(true);

        UIClickOutsideHandler clickOutsideHandler = placeNodeUI.GetComponent<UIClickOutsideHandler>();
        if (clickOutsideHandler == null) {
            // Add the handler if it doesn't exist
            clickOutsideHandler = placeNodeUI.AddComponent<UIClickOutsideHandler>();
            clickOutsideHandler.targetUI = placeNodeUI;
        }

        if (menuController != null) {
            menuController.SetSelectedPlot(this);
        }
    }

    public void PlaceNode(int nodeIndex) {
        NodeTower nodeToBuild = BuildManager.main.GetTowerAtIndex(nodeIndex);

        if (nodeToBuild == null) {
            Debug.LogWarning("Invalid node index: " + nodeIndex);
            return;
        }

        // Check if enough currency
        if (nodeToBuild.cost > LevelManager.main.currency) {
            Debug.Log("Not enough currency! Need " + nodeToBuild.cost + " but have " + LevelManager.main.currency);
            return;
        }

        LevelManager.main.SpendCurrency(nodeToBuild.cost);

        nodeObj = Instantiate(nodeToBuild.prefab, transform.position, Quaternion.identity);
        node = nodeObj.GetComponent<Node>();

        // Set the parent plot on the node
        if (node != null) {
            node.parentPlot = this;
        }

        if (WsClient.Instance != null) {
            // Send more detailed node placement message
            string nodeTypeStr = nodeToBuild.name.ToLower();

            // Include position in the message
            Vector3 position = transform.position;

            // WsClient.Instance.NotifyNodePlaced(nodeTypeStr);
            // WsClient.Instance.SendWebSocketMessage("Node placed: " + nodeTypeStr + " at position " + position);
            NodePlacedMessage msg = new NodePlacedMessage {
                type = "node_placed",
                nodeType = nodeTypeStr,
                position = new Position {
                    x = position.x,
                    y = position.y,
                    z = position.z
                },
                timestamp = DateTime.UtcNow.ToString("o")
            };

            // Send a single, structured message
            string json = JsonUtility.ToJson(msg);
            WsClient.Instance.SendWebSocketMessage(json);

        }

        placeNodeUI.SetActive(false);
        UIManager.main.SetHoveringState(false);
    }

    public void SetNodeId(string id) {
        nodeId = id;
        if (node != null) {
            node.nodeId = id;
            node.parentPlot = this;
        }
    }
}

// Define the message class for node selection
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