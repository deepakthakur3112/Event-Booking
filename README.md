# 🎟 EventPlanning

## Overview

This repository contains a **production-oriented prototype** of an event ticketing system built as a **vertical slice** (Frontend + Backend).

The primary goal of this exercise is to demonstrate **safe seat reservation under concurrent access**, ensuring that **double booking is impossible**, even when multiple users attempt to reserve the same seat at the same time.

The solution focuses on **correctness, clarity, and real-world concurrency handling**, rather than feature breadth.

---

## Scope of Implementation

The system supports the following flow:

1. View available events
2. View seats for an event
3. Temporarily **hold** a seat for 60 seconds
4. **Confirm** the booking (payment assumed successful)

---

## Key Design Decision: Concurrency Control

### Problem

In a distributed system, relying solely on database updates is not sufficient to prevent race conditions when multiple users attempt to reserve the same seat simultaneously.

### Solution

This implementation uses **Redis with the Redlock algorithm** to enforce **distributed mutual exclusion** at the seat level.

#### Locking Strategy

* Each seat maps to a unique Redis lock:

  ```
  lock:event:{eventId}:seat:{seatId}
  ```
* When a user selects a seat:

  * A lock is acquired with a **5 minute TTL**
  * The seat becomes unavailable to other users
* If another user attempts to hold the same seat:

  * The request fails immediately
* On confirmation:

  * Lock ownership is verified
  * Seat state is persisted to MongoDB as `BOOKED`

This guarantees:

* No double holds
* No double bookings
* Automatic cleanup if the user abandons the flow

---

## Why Redis + Redlock?

* Works reliably across multiple backend instances
* TTL prevents deadlocks
* Decouples concurrency control from database state
* Commonly used pattern in high-traffic ticketing and inventory systems

MongoDB is used as the **source of truth**, while Redis is used strictly for **short-lived coordination**.

---

## Technology Stack

* **Frontend**: React 18 (Vite)
* **Backend**: Node.js 24, Express (JavaScript)
* **Database**: MongoDB
* **Concurrency**: Redis + Redlock
* **Infrastructure**: Docker & Docker Compose

---

## Running the Application

### Prerequisites

Only the following need to be installed locally:

* Docker
* Docker Compose

No local installation of Node.js, MongoDB, or Redis is required.

---

### Start All Services

From the project root:

```bash
docker-compose up --build
```

This starts:

* MongoDB
* Redis
* Backend API
* Frontend UI

---

### Seed Demo Data

To create a sample event with seats:

```bash
docker-compose exec backend npm run seed
```

---

## Access Points

| Service     | URL                                            |
| ----------- | ---------------------------------------------- |
| Frontend    | [http://localhost:5173](http://localhost:5173) |
| Backend API | [http://localhost:4000](http://localhost:4000) |

---

## Logging & Debugging

View logs for all services:

```bash
docker-compose logs -f
```

Backend only:

```bash
docker-compose logs -f backend
```

Redis only:

```bash
docker-compose logs -f redis
```

---