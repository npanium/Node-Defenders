using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class MainNodeHealth : MonoBehaviour {
    [Header("Health Settings")]
    [SerializeField] private int maxHealth = 100;
    [SerializeField] private int currentHealth;

    [Header("UI References")]
    [SerializeField] private TextMeshProUGUI healthText;

    [Header("Game Over")]
    [SerializeField] private GameObject gameOverPanel;

    // Events
    public delegate void HealthChangedHandler(int currentHealth, int maxHealth);
    public static event HealthChangedHandler OnHealthChanged;

    private void Start() {
        currentHealth = maxHealth;
        UpdateHealthUI();

        // Hide game over panel if assigned
        if (gameOverPanel != null) {
            gameOverPanel.SetActive(false);
        }
    }

    private void OnCollisionEnter2D(Collision2D collision) {
        // Check if collided with an enemy
        if (collision.gameObject.layer == LayerMask.NameToLayer("Enemy")) {
            // Get enemy attack power
            int attackPower = 1; // Default value
            Enemy enemy = collision.gameObject.GetComponent<Enemy>();
            if (enemy != null) {
                attackPower = enemy.GetAttackPower();
            }

            // Take damage
            TakeDamage(attackPower);

            // Destroy the enemy
            Destroy(collision.gameObject);

            // Make sure to invoke enemy destroy event so enemy counter updates
            EnemySpawner.onEnemyDestroy.Invoke();
        }
    }

    public void TakeDamage(int damage) {
        currentHealth -= damage;

        // Ensure health doesn't go below 0
        currentHealth = Mathf.Max(0, currentHealth);

        // Update UI
        UpdateHealthUI();

        // Trigger event
        if (OnHealthChanged != null) {
            OnHealthChanged.Invoke(currentHealth, maxHealth);
        }

        // Check for game over
        if (currentHealth <= 0) {
            GameOver();
        }
    }

    private void UpdateHealthUI() {
        if (healthText != null) {
            healthText.text = $"Health: {currentHealth}/{maxHealth}";
        }
    }

    private void GameOver() {
        Debug.Log("Game Over - Main Node Destroyed!");

        // Show game over panel if assigned
        if (gameOverPanel != null) {
            gameOverPanel.SetActive(true);
        }

        // Optionally pause the game
        Time.timeScale = 0;
    }

    // Getter for current health (%)
    public float GetHealthPercentage() {
        return (float)currentHealth / maxHealth;
    }
}