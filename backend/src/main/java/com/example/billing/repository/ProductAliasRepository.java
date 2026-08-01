package com.example.billing.repository;

import com.example.billing.entity.ProductAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ProductAliasRepository extends JpaRepository<ProductAlias, Long> {

    List<ProductAlias> findByProduct_ProductIdAndCompanyId(Long productId, Long companyId);

    @Query("SELECT pa FROM ProductAlias pa WHERE LOWER(pa.aliasName) = :aliasName AND pa.companyId = :companyId")
    List<ProductAlias> findByAliasNameIgnoreCase(String aliasName, Long companyId);

    @Query("SELECT pa FROM ProductAlias pa WHERE LOWER(pa.aliasName) IN :aliasNames AND pa.companyId = :companyId")
    List<ProductAlias> findByAliasNamesIn(List<String> aliasNames, Long companyId);

    @Query("SELECT DISTINCT pa.product.productId FROM ProductAlias pa WHERE LOWER(pa.aliasName) = :aliasName AND pa.companyId = :companyId")
    Optional<Long> findProductIdByAliasName(String aliasName, Long companyId);

    @Query("SELECT pa FROM ProductAlias pa WHERE pa.product.productId = :productId AND pa.companyId = :companyId")
    List<ProductAlias> findAllByProductId(Long productId, Long companyId);

    void deleteByAliasId(Long aliasId);

    boolean existsByAliasNameIgnoreCaseAndCompanyId(String aliasName, Long companyId);

    List<ProductAlias> findByCompanyId(Long companyId);
}
