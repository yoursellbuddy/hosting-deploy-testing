<?php

namespace App\Models;

class TestRecord
{
    protected $table = 'test_records';
    protected $fillable = ['title', 'details', 'status'];

    public static function allRecords($pdo)
    {
        $stmt = $pdo->query("SELECT * FROM test_records ORDER BY id DESC");
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public static function createRecord($pdo, $title, $details = '', $status = 'Active')
    {
        $stmt = $pdo->prepare("INSERT INTO test_records (title, details, status) VALUES (:title, :details, :status)");
        $stmt->execute([
            ':title' => $title,
            ':details' => $details,
            ':status' => $status
        ]);
        $id = $pdo->lastInsertId();
        
        $fetch = $pdo->prepare("SELECT * FROM test_records WHERE id = :id");
        $fetch->execute([':id' => $id]);
        return $fetch->fetch(\PDO::FETCH_ASSOC);
    }

    public static function deleteRecord($pdo, $id)
    {
        $stmt = $pdo->prepare("DELETE FROM test_records WHERE id = :id");
        return $stmt->execute([':id' => $id]);
    }
}
