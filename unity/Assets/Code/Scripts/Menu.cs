using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class Menu : MonoBehaviour {
    [Header("References")]
    [SerializeField] TextMeshProUGUI currencyUI;
    [SerializeField] Animator anim;

    private bool isMenuOpen = true;
    private Plot selectedPlot;

    public void ToggleMenu() {
        isMenuOpen = !isMenuOpen;
        anim.SetBool("MenuOpen", isMenuOpen);
    }

    private void Update() {
        // Update currency UI in Update instead of OnGUI for better performance
        if (currencyUI != null && LevelManager.main != null) {
            currencyUI.text = LevelManager.main.currency.ToString();
        }
    }

    // private void OnGUI() {
    //     currencyUI.text = LevelManager.main.currency.ToString();
    // }

    public void SetSelectedPlot(Plot plot) {
        selectedPlot = plot;
        Debug.Log("Selected plot set: " + plot.gameObject.name);

        // You could notify your NextJS system here if needed
        if (WsClient.Instance != null) {
            WsClient.Instance.SendWebSocketMessage("Plot selected: " + plot.gameObject.name);
        }
    }
}
