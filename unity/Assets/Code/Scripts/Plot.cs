using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Plot : MonoBehaviour {
    [Header("References")]
    [SerializeField] private SpriteRenderer sr;
    [SerializeField] private Color hoverColor;
    [SerializeField] private GameObject placeNodeUI;

    private GameObject nodeObj;
    public Node node;
    private Color startColor;

    // private WsClient wsClient;
    private Menu menuController;


    private void Start() {
        startColor = sr.color;

        // wsClient = FindObjectOfType<WsClient>();

        if (placeNodeUI == null) {
            Debug.LogError("PlaceNodeUI reference is missing on Plot: " + gameObject.name);
        }
        menuController = FindObjectOfType<Menu>();
        if (menuController == null) {
            Debug.LogWarning("Plot: Menu controller not found in scene");
        }
        // if (wsClient != null) {
        //     Debug.Log("Plot: WsClient reference obtained");
        // } else {
        //     Debug.LogWarning("Plot: Failed to get WsClient reference");
        // }
    }

    private void OnMouseEnter() {
        if (nodeObj == null) {
            sr.color = hoverColor;
        }
    }

    private void OnMouseExit() {
        sr.color = startColor;
    }

    private void OnMouseDown() {
        if (UIManager.main.IsHoveringUI()) return;
        // if (wsClient != null) {
        //     wsClient.SendWebSocketMessage("Plot clicked");
        // }
        Debug.Log("OnMouseDown");
        if (nodeObj != null) {
            Debug.Log("Node exists - would handle upgrade via NextJS: " + nodeObj.name);
            return;
        }

        OpenPlaceNodeUI();


    }

    public void OpenPlaceNodeUI() {
        Debug.Log("OpenPlaceNodeUI");

        // To avoid conflicts with the UIClickOutsideHandler script
        StartCoroutine(OpenUINextFrame());

        // placeNodeUI.SetActive(true);

        // UIManager.main.SetHoveringState(true);

        // UIClickOutsideHandler clickOutsideHandler = placeNodeUI.GetComponent<UIClickOutsideHandler>();
        // if (clickOutsideHandler == null) {
        //     // Add the handler if it doesn't exist
        //     clickOutsideHandler = placeNodeUI.AddComponent<UIClickOutsideHandler>();
        //     clickOutsideHandler.targetUI = placeNodeUI;
        // }


        // if (menuController != null) {
        //     menuController.SetSelectedPlot(this);
        // }
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

        if (WsClient.Instance != null) {
            WsClient.Instance.NotifyNodePlaced(nodeToBuild.name);
            WsClient.Instance.SendWebSocketMessage("Node placed: " + nodeToBuild.name + " at position " + transform.position);
        }

        placeNodeUI.SetActive(false);
        UIManager.main.SetHoveringState(false);
    }
}