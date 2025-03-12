using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;


public class EnemySpawner : MonoBehaviour {
    [Header("References")]
    [SerializeField] private GameObject[] enemyPrefabs;

    [Header("Attributes")]
    [SerializeField] private int baseEnemies = 8;
    [SerializeField] private float enemiesPerSecond = 0.5f;
    [SerializeField] private float timeBetweenWaves = 5f;
    [SerializeField] private float difficultyScalingFactor = 0.75f;
    [SerializeField] private float enemiesPerSecondCap = 15f;

    [SerializeField] private int maxWaves = 10;
    [SerializeField] private float countdownTime = 15f;

    [Header("Events")]
    public static UnityEvent onEnemyDestroy = new UnityEvent();

    private int currentWave = 1;
    private float timeSinceLastSpawn;
    private int enemiesAlive;
    private int enemiesLeftToSpawn;
    private float eps; // Enemies per second
    private bool isSpawning = false;

    public int CurrentWave => currentWave;
    public int MaxWaves => maxWaves;
    public float CurrentCountdown { get; private set; }
    public bool IsCountingDown { get; private set; }

    private void Awake() {
        onEnemyDestroy.AddListener(onEnemyDestroyed);
    }

    private void Start() {
        StartCoroutine(StartWave());
    }

    private void Update() {
        if (!isSpawning) return;
        timeSinceLastSpawn += Time.deltaTime;

        if ((timeSinceLastSpawn >= 1f / eps) && enemiesLeftToSpawn > 0) {
            SpawnEnemy();
            enemiesLeftToSpawn--;
            enemiesAlive++;
            timeSinceLastSpawn = 0f;
        }

        if (enemiesAlive == 0 && enemiesLeftToSpawn == 0) {
            EndWave();
        }
    }

    private void EndWave() {
        isSpawning = false;
        timeSinceLastSpawn = 0f;
        currentWave++;

        // Check if we've reached max waves
        if (currentWave > maxWaves) {
            // Game complete!
            if (WsClient.Instance != null) {
                WsClient.Instance.NotifyGameWon("max_waves_completed");
            }

            // You could trigger a "victory" screen here
            Debug.Log("Game Won! All waves completed!");
            return;
        }

        StartCoroutine(StartWave());

    }

    private void SpawnEnemy() {
        int index = UnityEngine.Random.Range(0, enemyPrefabs.Length);
        GameObject prefabToSpawn = enemyPrefabs[index];
        Instantiate(prefabToSpawn, LevelManager.main.startPoint.position, Quaternion.identity);
    }

    private void onEnemyDestroyed() {
        enemiesAlive--;
        LevelManager.main.IncrementEnemiesKilled();
    }

    private IEnumerator StartWave() {
        IsCountingDown = true;
        CurrentCountdown = countdownTime;

        // Broadcast wave countdown start through WebSocket
        if (WsClient.Instance != null) {
            // When sending wave countdown info
            WsClient.Instance.NotifyWaveCountdown(currentWave, countdownTime, maxWaves);
        }

        // Count down
        while (CurrentCountdown > 0) {
            yield return new WaitForSeconds(1f);
            CurrentCountdown--;

            // Send countdown update each second
            if (WsClient.Instance != null) {
                WsClient.Instance.NotifyWaveCountdown(currentWave, CurrentCountdown, maxWaves);
            }
        }

        IsCountingDown = false;
        isSpawning = true;
        enemiesLeftToSpawn = EnemiesPerWave();
        eps = EnemiesPerSecond();

        if (WsClient.Instance != null) {
            WsClient.Instance.NotifyWaveStarted(currentWave, enemiesLeftToSpawn + enemiesAlive, maxWaves);
        }

    }

    private int EnemiesPerWave() {
        return Mathf.RoundToInt(baseEnemies * Mathf.Pow(currentWave, difficultyScalingFactor));
    }

    private float EnemiesPerSecond() {
        return Mathf.Clamp(enemiesPerSecond * Mathf.Pow(currentWave, difficultyScalingFactor), 0f, enemiesPerSecondCap);
    }
}
