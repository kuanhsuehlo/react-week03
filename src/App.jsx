import axios from 'axios';
import { useEffect, useState, useRef } from 'react'
import * as bootstrap from 'bootstrap';
import './assets/all.scss'


const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

// 建立初始化的資料 INITAL_TEMPLATE
const INITAL_TEMPLATE_DATA = {
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
};

function App() {
  // 狀態管理的hook，useState
  // 登入與登入失敗的狀態管理，登入成功後才會變true
  const [isAuth, setIsAuth] = useState(false);
  const [products, setProducts] = useState([]);
  const [account, setAccount] = useState({
    username: '',
    password: ''
  });

  // 產品資料INITAL_TEMPLATE_DATA初始化放入templateProduct的useState
  const [templateProduct, setTemplateProduct] = useState(INITAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState('');

  const productModalRef = useRef(null);


  // 帳號和密碼輸入的函式
  const handleInputChange = (e) => {
    // 解構name和value
    const { name, value } = e.target;
    setAccount((preData) => ({
      ...preData, [name]: value
    }))
  }

  // 輸入編輯和新增的函式
  const handleModalInputChange = (e) => {
    // 和handleInputChange依樣，解構name和value，只是useState的狀態不同
    const { name, value, checked, type } = e.target;
    setTemplateProduct((preData) => ({
      ...preData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // 綁定副圖片的函式
  const handleImageChange = (index, value) => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage[index] = value;

      // 跟助教一起練習
      // 驗證填寫最後一個空的輸入框時，自動新增空白輸入框
      // if (
      //   value !== "" &&
      //   index === newImage.length - 1 &&
      //   newImage.length < 5
      // ) {
      //   newImage.push("");
      // }

      // // 清空輸入框時，移除最後的空白輸入框
      // if (
      //   value === "" &&
      //   newImage.length > 1 &&
      //   newImage[newImage.length - 1] === ""
      // ) {
      //   newImage.pop();
      // }


      return {
        ...pre,
        imagesUrl: newImage
      }
    })
  }

  // 新增圖片的函式
  const handleAddImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.push('');
      return {
        ...pre,
        imagesUrl: newImage
      }
    })
  }

  // 刪除圖片的函式
  const handleRemoveImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.pop('');
      return {
        ...pre,
        imagesUrl: newImage
      }
    })
  }

  // 產品的api
  const getProduct = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/admin/products`)
      setProducts(res.data.products)
    } catch (err) {
      alert('無法取的資料', err);
    }
  }

  const updateProduct = async (id) => {
    let url = `${BASE_URL}/v2/api/${API_PATH}/admin/product`
    let method = 'post'

    if (modalType === 'edit') {
      url = `${BASE_URL}/v2/api/${API_PATH}/admin/product/${id}`
      method = 'put'
    }

    const productData = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== "")],
      },
    };

    try {
      const res = await axios[method](url, productData)
      getProduct();
      closeModal();
    } catch (err) {
      alert(err, '更新錯誤');
    }
  }


  const delProduct = async (id) => {
    try {
      const res = await axios.delete(`${BASE_URL}/api/${API_PATH}/admin/product/${id}`)
      alert("產品刪除成功！");
      getProduct();
      closeModal();
    } catch (err) {
      alert(err, '無法刪除')
    }
  }

  // 登入帳密的函式
  const handlerLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account)
      const { token, expired } = res.data;
      document.cookie = `hexToken=${token}; expires=${expired}`;

      axios.defaults.headers.common['Authorization'] = token;
      setIsAuth(true);
      getProduct();
    } catch (err) {
      console.log(err);
    }
  }



  useEffect(() => {
    // 檢查登入狀態
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];

    if (token) {
      axios.defaults.headers.common.Authorization = token;
    }

    // useRef的current取得Dom元素
    productModalRef.current = new bootstrap.Modal('#productModal', {
      keyboard: false,
    })

    // 確認登入得函式
    const checkUserlogin = async () => {
      try {
        await axios.post(`${BASE_URL}/v2/api/user/check`)
        setIsAuth(true);
        getProduct();
      } catch (err) {
        alert("權限檢查失敗：", err.response?.data?.message);
        setIsAuth(false);
      }
    }
    checkUserlogin();
  }, [])


  const openModal = (type, product) => {
    setModalType(type);
    setTemplateProduct((pre) => ({
      ...pre, ...product
    }));
    productModalRef.current.show();
  }

  const closeModal = () => {
    productModalRef.current.hide();
  }


  return (
    <>
      {isAuth ? (
        <div className='container py-2'>
          <div className='row'>
            <div className='col'>
              <h2>產品列表</h2>
              <div className='text-end my-4'>
                <button type='button' className='btn btn-primary' onClick={() => openModal('create', INITAL_TEMPLATE_DATA)}>建立新產品</button>
              </div>
              <table className='table'>
                <thead className='text-center'>
                  <tr>
                    <th scope='col'>分類</th>
                    <th scope='col'>產品名稱</th>
                    <th scope='col'>原價</th>
                    <th scope='col'>售價</th>
                    <th scope='col'>是否啟用</th>
                    <th scope='col'>編輯</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr className='text-center' key={product.id}>
                      <td>{product.category}</td>
                      <th scope='row'>{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td className={`${product.is_enabled ? "text-success" : "text-danger"}`}>{product.is_enabled ? '啟用' : '未啟用'}</td>
                      <td className='text-center'>
                        <div className="btn-group" role="group" aria-label="Basic example">
                          {/* 編輯的按鈕取得product的資料'edit',product*/}
                          <button type="button" className="btn btn-outline-success btn-sm" onClick={() => openModal('edit', product)}>編輯</button>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => openModal('delete', product)}>刪除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <h1 className="mb-5">請先登入</h1>
        <form onSubmit={handlerLogin} className="d-flex flex-column gap-3">
          <div className="form-floating mb-3">
            <input name='username' value={account.username} onChange={handleInputChange} type="email" className="form-control" id="username" placeholder="name@example.com" />
            <label htmlFor="username">Email address</label>
          </div>
          <div className="form-floating">
            <input name='password' value={account.password} onChange={handleInputChange} type="password" className="form-control" id="password" placeholder="Password" />
            <label htmlFor="password">Password</label>
          </div>
          <button className="btn btn-primary">登入</button>
        </form>
        <p className="mt-5 mb-3 text-muted">&copy; 2026~∞ - 在家裡發酵</p>
      </div>}

      {/*Modal*/}
      <div ref={productModalRef} className="modal fade" id="productModal" tabIndex="-1" aria-labelledby="productModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className={`modal-header bg-${modalType === 'delete' ? 'danger' : 'primary'} text-white`}>
              <h5 id="productModalLabel" className="modal-title">
                <span>{modalType === 'delete' ? '刪除' : modalType === 'edit' ? '編輯' : '新增'}產品</span>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {
                modalType === 'delete' ? (
                  <p className="fs-4">
                    確定要刪除
                    <span className="text-danger">{templateProduct.title}</span>嗎？
                  </p>
                ) : (
                  <div className="row">
                    <div className="col-sm-4">
                      <div className="mb-2">
                        <div className="mb-3">
                          <label htmlFor="imageUrl" className="form-label">
                            輸入圖片網址
                          </label>
                          <input
                            type="text"
                            id="imageUrl"
                            name="imageUrl"
                            className="form-control"
                            placeholder="請輸入圖片連結"
                            value={templateProduct.imageUrl}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                        {templateProduct.imageUrl && (
                          <img className="img-fluid" src={templateProduct.imageUrl} alt={templateProduct.title} />
                        )}
                      </div>
                      <div>
                        {templateProduct.imagesUrl.map((url, index) => (
                          <div key={index}>
                            <label htmlFor="imageUrl" className="form-label">
                              輸入圖片網址
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`圖片網址${index + 1}`}
                              value={url}
                              onChange={(e) => handleImageChange(index, e.target.value)}
                            />
                            {
                              url && (
                                <img
                                  className="img-fluid"
                                  src={url}
                                  alt={`副圖${index + 1}`}
                                />
                              )
                            }
                          </div>
                        ))}
                        {/* 優化驗證的部分 */}
                        {
                          templateProduct.imagesUrl.length < 5 &&
                          templateProduct.imagesUrl[templateProduct.imagesUrl.length - 1] !== "" &&
                          <button className="btn btn-outline-primary btn-sm d-block w-100" onClick={() => handleAddImage()}>
                            新增圖片
                          </button>
                        }
                      </div>
                      <div>
                        {
                          templateProduct.imagesUrl.length >= 1 &&
                          <button className="btn btn-outline-danger btn-sm d-block w-100" onClick={() => handleRemoveImage()}>
                            刪除圖片
                          </button>
                        }
                      </div>
                    </div>
                    <div className="col-sm-8">
                      <div className="mb-3">
                        <label htmlFor="title" className="form-label">標題</label>
                        <input
                          name="title"
                          id="title"
                          type="text"
                          className="form-control"
                          placeholder="請輸入標題"
                          value={templateProduct.title}
                          onChange={(e) => handleModalInputChange(e)}
                        />
                      </div>

                      <div className="row">
                        <div className="mb-3 col-md-6">
                          <label htmlFor="category" className="form-label">分類</label>
                          <input
                            name="category"
                            id="category"
                            type="text"
                            className="form-control"
                            placeholder="請輸入分類"
                            value={templateProduct.category}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                        <div className="mb-3 col-md-6">
                          <label htmlFor="unit" className="form-label">單位</label>
                          <input
                            name="unit"
                            id="unit"
                            type="text"
                            className="form-control"
                            placeholder="請輸入單位"
                            value={templateProduct.unit}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="mb-3 col-md-6">
                          <label htmlFor="origin_price" className="form-label">原價</label>
                          <input
                            name="origin_price"
                            id="origin_price"
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入原價"
                            value={templateProduct.origin_price}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                        <div className="mb-3 col-md-6">
                          <label htmlFor="price" className="form-label">售價</label>
                          <input
                            name="price"
                            id="price"
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="請輸入售價"
                            value={templateProduct.price}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                        </div>
                      </div>
                      <hr />

                      <div className="mb-3">
                        <label htmlFor="description" className="form-label">產品描述</label>
                        <textarea
                          name="description"
                          id="description"
                          className="form-control"
                          placeholder="請輸入產品描述"
                          value={templateProduct.description}
                          onChange={(e) => handleModalInputChange(e)}
                        ></textarea>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="content" className="form-label">說明內容</label>
                        <textarea
                          name="content"
                          id="content"
                          className="form-control"
                          placeholder="請輸入說明內容"
                          value={templateProduct.content}
                          onChange={(e) => handleModalInputChange(e)}
                        ></textarea>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            name="is_enabled"
                            id="is_enabled"
                            className="form-check-input"
                            type="checkbox"
                            checked={templateProduct.is_enabled}
                            onChange={(e) => handleModalInputChange(e)}
                          />
                          <label className="form-check-label" htmlFor="is_enabled">
                            是否啟用
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            </div>
            <div className="modal-footer">
              {modalType === 'delete' ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProduct(templateProduct.id)}
                >
                  刪除
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    onClick={() => closeModal()}
                  >
                    取消
                  </button>
                  <button type="button" className="btn btn-primary"
                    onClick={() => updateProduct(templateProduct.id)}
                  >確認</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
