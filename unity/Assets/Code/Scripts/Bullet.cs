using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Bullet : MonoBehaviour {
    [Header("References")]
    [SerializeField] private Rigidbody2D rb;

    [Header("Attributes")]
    [SerializeField] private float bulletSpeed = 5f;
    [SerializeField] private int bulletDamage = 1;

    private Transform target;

    public void SetTarget(Transform _target) {
        target = _target;
    }

    // Set bullet damage
    public void SetDamage(int damage) {
        bulletDamage = damage;
    }

    // Set bullet speed
    public void SetSpeed(float speed) {
        bulletSpeed = speed;
    }

    private void FixedUpdate() {
        if (!target) return;
        Vector2 direction = (target.position - transform.position).normalized;

        rb.velocity = direction * bulletSpeed;
    }

    private void OnCollisionEnter2D(Collision2D other) {
        Enemy enemy = other.gameObject.GetComponent<Enemy>();
        if (enemy != null) {
            enemy.TakeDamage(bulletDamage);
        }
        Destroy(gameObject);
    }
}