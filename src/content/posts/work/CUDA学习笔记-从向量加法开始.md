---
title: CUDA 学习笔记：从向量加法开始
date: 2026-10-20
tags:
  - CUDA
  - 性能优化
description: 用向量加法理解 CUDA 的线程层级、访存合并和网格步长循环，并做一次简单的带宽测试。
---

向量加法是 CUDA 里的「Hello World」。它足够简单，可以把注意力放在线程组织上；又足够真实，能暴露访存是否合并这类性能问题。

本文假设你已经有一块能跑 CUDA 的显卡，并且装好了 toolkit。

## 一个最朴素的 kernel

每个线程负责一个元素：

```cpp
__global__ void add(const float* a, const float* b, float* c, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        c[i] = a[i] + b[i];
    }
}
```

启动时把数组长度向上取整到 block 的整数倍：

```cpp
int threads = 256;
int blocks = (n + threads - 1) / threads;
add<<<blocks, threads>>>(a, b, c, n);
```

这里有两个层级需要分清：

- `blockIdx.x` 是 block 在 grid 中的编号；
- `threadIdx.x` 是线程在 block 中的编号。

两者合起来，才能得到全局唯一的线程编号 $i$。

## 访存合并

如果相邻线程访问相邻地址，一个 warp 的 32 次访问会被合并成少量内存事务。反之，如果步长很大，每个线程都命中不同的 cache line，带宽会成倍下降。

对于一维数组，`c[i] = a[i] + b[i]` 天然是合并的，因为 `threadIdx.x` 连续递增。

可以用一个简单的指标估算是否接近硬件的理论带宽：

$$
\text{effective bandwidth} = \frac{3 \times n \times 4\ \text{bytes}}{t}
$$

其中分子里的 3 表示读了 `a`、`b`，写了 `c`。$t$ 是 kernel 的执行时间。

| 数据规模 | 线程数 | 实测带宽 | 理论带宽 |
| --- | --- | --- | --- |
| 16 MB | 256 | 420 GB/s | 936 GB/s |
| 256 MB | 256 | 780 GB/s | 936 GB/s |
| 1 GB | 512 | 861 GB/s | 936 GB/s |

小规模数据受启动开销影响明显，规模上来之后才接近峰值。

## 网格步长循环

当数据量超过一次能启动的线程数时，可以让每个线程处理多个元素：

```cpp
__global__ void addStrided(const float* a, const float* b, float* c, int n) {
    for (int i = blockIdx.x * blockDim.x + threadIdx.x;
         i < n;
         i += blockDim.x * gridDim.x) {
        c[i] = a[i] + b[i];
    }
}
```

这里 `gridDim.x * blockDim.x` 是整个 grid 的线程总数，也就是步长。这样既减少了 block 数量，又保持了合并访存。

### 选择 grid 大小

一个常见的经验是让 grid 的线程总数覆盖 SM 的常驻线程容量，再乘以若干倍，保证有足够的并行度。具体数字和架构有关，最好直接用 profiler 看。

## 计时

不要用 CPU 端的 `clock()` 给 kernel 计时，它测不到异步执行的时间。用 CUDA event：

```cpp
cudaEvent_t start, stop;
cudaEventCreate(&start);
cudaEventCreate(&stop);

cudaEventRecord(start);
add<<<blocks, threads>>>(a, b, c, n);
cudaEventRecord(stop);

cudaEventSynchronize(stop);

float ms = 0;
cudaEventElapsedTime(&ms, start, stop);
```

## 小结

向量加法本身没有多少计算，但它是理解 CUDA 执行模型的好切口：

1. 线程编号由 block 和 thread 两个维度组合而成；
2. 相邻线程访问相邻地址，才能合并访存；
3. 数据量大时，用网格步长循环复用线程；
4. 计时要用 CUDA event，而不是 host 端计时器。

下一步可以试着把加法换成归约，看看 shared memory 和同步为什么会变得重要。
