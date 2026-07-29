package com.example.billing.repository;

import com.example.billing.entity.ProductAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ProductAliasRepository extends JpaRepository<ProductAlias, Long> {

    List<ProductAlias> findByProduct_ProductId(Long productId);

    @Query("SELECT pa FROM ProductAlias pa WHERE LOWER(pa.aliasName) = :aliasName")
    List<ProductAlias> findByAliasNameIgnoreCase(String aliasName);

    @Query("SELECT pa FROM ProductAlias pa WHERE LOWER(pa.aliasName) IN :aliasNames")
    List<ProductAlias> findByAliasNamesIn(List<String> aliasNames);

    @Query("SELECT DISTINCT pa.product.productId FROM ProductAlias pa WHERE LOWER(pa.aliasName) = :aliasName")
    Optional<Long> findProductIdByAliasName(String aliasName);

    @Query("SELECT pa FROM ProductAlias pa WHERE pa.product.productId = :productId")
    List<ProductAlias> findAllByProductId(Long productId);

    void deleteByAliasId(Long aliasId);

    boolean existsByAliasNameIgnoreCase(String aliasName);
}
