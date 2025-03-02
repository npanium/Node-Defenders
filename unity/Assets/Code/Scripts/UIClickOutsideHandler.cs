using UnityEngine;
using UnityEngine.EventSystems;

public class UIClickOutsideHandler : MonoBehaviour {
    [Tooltip("The UI element that should be closed when clicking outside")]
    [SerializeField] public GameObject targetUI;

    void Update() {

        // Check for mouse click
        if (Input.GetMouseButtonDown(0)) {
            // Check if the click is outside UI elements
            if (!IsPointerOverUIElement()) {
                Debug.Log("Mouse pointer is NOT over ui element");
                // Close the target UI
                if (targetUI != null && targetUI.activeSelf) {
                    targetUI.SetActive(false);

                    // Reset hovering state
                    if (UIManager.main != null) {
                        UIManager.main.SetHoveringState(false);
                    }
                }
            }
        }
    }

    // Check if the pointer is currently over any UI element
    private bool IsPointerOverUIElement() {
        return EventSystem.current.IsPointerOverGameObject();
    }
}