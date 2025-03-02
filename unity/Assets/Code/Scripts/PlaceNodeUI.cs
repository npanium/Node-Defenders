using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

public class PlaceNodeUI : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler {
    [Header("References")]
    [SerializeField] private Button[] nodeButtons;
    [SerializeField] private TextMeshProUGUI[] nodeCostTexts;
    [SerializeField] private Plot parentPlot;

    private bool mouseOver = false;


    private void Start() {
        if (parentPlot == null) {
            parentPlot = GetComponentInParent<Plot>();
        }

        // Set up button click handlers
        for (int i = 0; i < nodeButtons.Length; i++) {
            int nodeIndex = i; // Create local variable for proper closure
            nodeButtons[i].onClick.AddListener(() => OnNodeButtonClicked(nodeIndex));

            // Update cost text if available
            if (i < nodeCostTexts.Length && nodeCostTexts[i] != null) {
                NodeTower nodeTower = BuildManager.main.GetTowerAtIndex(nodeIndex);
                if (nodeTower != null) {
                    nodeCostTexts[i].text = nodeTower.cost.ToString();
                }
            }
        }
    }

    private void Update() {
        // Update button interactability based on available currency
        for (int i = 0; i < nodeButtons.Length && i < nodeButtons.Length; i++) {
            NodeTower nodeTower = BuildManager.main.GetTowerAtIndex(i);
            if (nodeTower != null) {
                nodeButtons[i].interactable = LevelManager.main.currency >= nodeTower.cost;
            }
        }
    }

    private void OnNodeButtonClicked(int nodeIndex) {
        if (parentPlot != null) {
            parentPlot.PlaceNode(nodeIndex);
        } else {
            Debug.LogError("PlaceNodeUI: No parent plot reference set!");
        }

        // Hide this UI after selection
        gameObject.SetActive(false);
        UIManager.main.SetHoveringState(false);
    }

    // Make sure we stay active if the mouse is over us
    public void OnPointerEnter(PointerEventData eventData) {
        mouseOver = true;
        UIManager.main.SetHoveringState(true);
    }

    public void OnPointerExit(PointerEventData eventData) {
        mouseOver = false;
        UIManager.main.SetHoveringState(false);

        // Close the UI when mouse leaves
        StartCoroutine(CloseAfterDelay(0.1f));
    }

    // Use a small delay to prevent accidental closes during quick mouse movements
    private IEnumerator CloseAfterDelay(float delay) {
        yield return new WaitForSeconds(delay);

        // Only close if mouse is still not over the UI
        if (!mouseOver) {
            gameObject.SetActive(false);
        }
    }

    // Close button handler
    public void Close() {
        gameObject.SetActive(false);
        UIManager.main.SetHoveringState(false);
    }
}